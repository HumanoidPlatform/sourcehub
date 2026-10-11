# DataMind360 on Google Cloud: prod and dev

Two environments in region **asia-south1 (Mumbai)**, one Google Cloud project each, on one billing account:

| | prod (`app.<domain>`) | dev (`dev.<domain>`) |
|---|---|---|
| Who uses it | the sales team, real clients and partners | the team's development and testing |
| Machine | VM `prod-app`, t2d-standard-1 (1 vCPU, 4 GB); e2-medium if T2D is unavailable | VM `dev-app`, e2-medium, weekdays 09:00–21:00 IST only |
| Runs | `gcp/compose.prod.yml`: caddy → web → api | `gcp/compose.dev.yml`: caddy → web → api → db |
| Database | Cloud SQL PostgreSQL 16, Enterprise, db-g1-small, private IP, 7 daily backups, 7-day point-in-time recovery | the `db` container on the VM, nightly dump to the bucket |
| Files | bucket `dm360-prod-files`, `STORAGE_PROVIDER=gcs` | bucket `dm360-dev-files`, `STORAGE_PROVIDER=gcs` |
| Mail and push clocks | on | off (`ENGAGEMENT_ENABLED=false`, `PUSH_ENABLED=false`) |

Images live in a private Artifact Registry repository in the prod project; the dev VM may read it.

**Why VMs, not Cloud Run.** The API runs its reminder, bidding and push clocks inside its own process, so it must never scale to zero. Cloud Run would need an always-on instance, and a load balancer for a custom domain in Mumbai. A VM costs less and runs the images as they are.

**Platform storage signs keylessly.** On these VMs no storage key exists. The API signs upload and download links through the IAM signBlob API, as the VM's own service account. That needs the IAM Service Account Credentials API on, and the account holding **Service Account Token Creator on itself**. A client's own Google Cloud Storage destination is different: the client uploads a service-account key in the console.

Placeholders below: `PROD=datamind360-prod-<sfx>`, `DEV=datamind360-dev-<sfx>`, `ZONE=asia-south1-a`, `<domain>`.

## 1. Account (once, in the console)

1. Turn on 2-step verification. Add a second Billing Account Administrator. Put the GSTIN on the payments profile.
2. Create the two projects and link both to the trial billing account.
3. Install the CLI on the laptop (`winget install Google.CloudSDK`), then `gcloud init` and `gcloud auth login`.
4. **Upgrade the billing account to paid at prod go-live, and by mid-December at the latest.** A trial that ends without an upgrade stops every resource and deletes them 30 days later. Unused credit stays usable after the upgrade until it expires on 8 Jan 2027.

Budgets only alert; they never stop spending. Leave credits out of them, or the credit hides the spend:

```
gcloud services enable billingbudgets.googleapis.com --project $PROD
gcloud billing budgets create --billing-account=<BILLING_ID> --display-name="trial credit" \
  --budget-amount=28797INR --credit-types-treatment=exclude-all-credits \
  --threshold-rule=percent=0.5 --threshold-rule=percent=0.75 --threshold-rule=percent=0.9 \
  --threshold-rule=percent=1.0 --threshold-rule=percent=1.0,basis=forecasted-spend
```

## 2. Foundation (each project)

```
gcloud services enable compute.googleapis.com sqladmin.googleapis.com servicenetworking.googleapis.com \
  artifactregistry.googleapis.com iap.googleapis.com iamcredentials.googleapis.com \
  logging.googleapis.com monitoring.googleapis.com --project $P

# SSH only through IAP; the web on 80/443; no RDP. OS Login for SSH keys.
gcloud compute firewall-rules delete default-allow-rdp default-allow-ssh --project $P --quiet
gcloud compute firewall-rules create allow-ssh-iap --network default --allow tcp:22 \
  --source-ranges 35.235.240.0/20 --target-tags ssh --project $P
gcloud compute firewall-rules create allow-web --network default --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 --target-tags web --project $P
gcloud compute project-info add-metadata --metadata enable-oslogin=TRUE --project $P

# The VM's own account. Not the default Compute account, which is an Editor of the project.
gcloud iam service-accounts create vm --display-name "DataMind360 VM" --project $P
VM_SA=vm@$P.iam.gserviceaccount.com
for r in roles/logging.logWriter roles/monitoring.metricWriter; do
  gcloud projects add-iam-policy-binding $P --member serviceAccount:$VM_SA --role $r; done
# Keyless signing: the account may sign as itself, and nothing else.
gcloud iam service-accounts add-iam-policy-binding $VM_SA \
  --member serviceAccount:$VM_SA --role roles/iam.serviceAccountTokenCreator --project $P
```

## 3. Buckets (one per project)

```
gcloud storage buckets create gs://dm360-prod-files --project $PROD --location asia-south1 \
  --uniform-bucket-level-access --public-access-prevention
gcloud storage buckets add-iam-policy-binding gs://dm360-prod-files \
  --member serviceAccount:vm@$PROD.iam.gserviceaccount.com --role roles/storage.objectAdmin
gcloud storage buckets update gs://dm360-prod-files --cors-file cors-prod.json
```

`cors-prod.json` (dev: the dev origin):

```json
[{"origin": ["https://app.<domain>"], "method": ["GET", "HEAD", "PUT"],
  "responseHeader": ["Content-Type", "Content-Disposition", "ETag"], "maxAgeSeconds": 3600}]
```

Leave the `_staging/` prefix to the platform. A lifecycle rule for abandoned uploads must match `_staging/` only.

## 4. Images (prod project)

```
gcloud artifacts repositories create datamind360 --repository-format docker --location asia-south1 --project $PROD
gcloud artifacts repositories add-iam-policy-binding datamind360 --location asia-south1 --project $PROD \
  --member serviceAccount:vm@$PROD.iam.gserviceaccount.com --role roles/artifactregistry.reader
gcloud artifacts repositories add-iam-policy-binding datamind360 --location asia-south1 --project $PROD \
  --member serviceAccount:vm@$DEV.iam.gserviceaccount.com --role roles/artifactregistry.reader
gcloud auth configure-docker asia-south1-docker.pkg.dev
REPO=asia-south1-docker.pkg.dev/$PROD/datamind360
docker tag jitendra1472/cosarathi:api-<sha> $REPO/api:<sha> && docker push $REPO/api:<sha>
docker tag jitendra1472/cosarathi:web-<sha> $REPO/web:<sha> && docker push $REPO/web:<sha>
```

Build only from a committed SHA. Once these work, make the Docker Hub repository private: the API image holds the source.

## 5. Cloud SQL (prod)

Never through the console wizard: it defaults to Enterprise Plus with high availability, many times the price.

```
# A private range for Google's services, clear of Docker's 172.16/12 and 192.168/16
gcloud compute addresses create google-managed-services-default --global --purpose VPC_PEERING \
  --addresses 10.100.0.0 --prefix-length 16 --network default --project $PROD
gcloud services vpc-peerings connect --service servicenetworking.googleapis.com \
  --ranges google-managed-services-default --network default --project $PROD

gcloud sql instances create dm360-prod --project $PROD --database-version POSTGRES_16 \
  --edition ENTERPRISE --tier db-g1-small --zone $ZONE --availability-type ZONAL \
  --storage-type SSD --storage-size 10 --storage-auto-increase \
  --network default --no-assign-ip --ssl-mode ENCRYPTED_ONLY \
  --backup-start-time 21:00 --retained-backups-count 7 \
  --enable-point-in-time-recovery --retained-transaction-log-days 7 \
  --maintenance-window-day SAT --maintenance-window-hour 21 --deletion-protection
gcloud sql users set-password postgres --instance dm360-prod --prompt-for-password --project $PROD
```

Backup and maintenance times are UTC; 21:00 UTC is 02:30 IST.

## 6. VMs

```
gcloud compute addresses create prod-ip --region asia-south1 --project $PROD
gcloud compute instances create prod-app --project $PROD --zone $ZONE --machine-type t2d-standard-1 \
  --image-family ubuntu-2404-lts-amd64 --image-project ubuntu-os-cloud \
  --boot-disk-size 20GB --boot-disk-type pd-balanced \
  --service-account vm@$PROD.iam.gserviceaccount.com --scopes cloud-platform \
  --tags web,ssh --address prod-ip --shielded-secure-boot --deletion-protection
gcloud compute ssh prod-app --zone $ZONE --project $PROD --tunnel-through-iap \
  --command "curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker \$USER && gcloud auth configure-docker asia-south1-docker.pkg.dev --quiet"

# Daily snapshots of the boot disk, kept 7 days
gcloud compute resource-policies create snapshot-schedule daily-7 --region asia-south1 \
  --max-retention-days 7 --daily-schedule --start-time 21:00 --project $PROD
gcloud compute disks add-resource-policies prod-app --resource-policies daily-7 --zone $ZONE --project $PROD
```

Dev is the same, with e2-medium and the `dev-ip` address, plus the working-hours schedule. The schedule may run up to 15 minutes late.

```
gcloud compute resource-policies create instance-schedule dev-hours --region asia-south1 \
  --vm-start-schedule "0 9 * * 1-5" --vm-stop-schedule "0 21 * * 1-5" --timezone Asia/Kolkata --project $DEV
gcloud projects add-iam-policy-binding $DEV --role roles/compute.instanceAdmin.v1 \
  --member serviceAccount:service-<DEV_PROJECT_NUMBER>@compute-system.iam.gserviceaccount.com
gcloud compute instances add-resource-policies dev-app --resource-policies dev-hours --zone $ZONE --project $DEV
```

## 7. Prod database, first time

From the VM, using a `postgres:16` container. The admin password is typed, never saved in a file:

```
docker run --rm -it postgres:16 psql "host=<private ip> user=postgres dbname=postgres sslmode=require"
  CREATE DATABASE appdb TEMPLATE template0 ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C';
  \c appdb
  \i managed_setup.sql            -- infra/db/managed_setup.sql, copied with gcloud compute scp
  ALTER ROLE sourcehub_app PASSWORD '<openssl rand -hex 24, generated on the VM>';
  \i schema.sql                   -- build/schema.sql from `make bundle` on the laptop
  \i seed.sql                     -- build/seed.sql: 900 and 905 only, never 910
```

Create `sourcehub_app` with SQL, as `managed_setup.sql` does. A user made in the console is made a `cloudsqlsuperuser`, and the API refuses to start as one. Then record the version:

```
docker run --rm -e DATABASE_ADMIN_URL='postgresql+asyncpg://postgres:<pw>@<private ip>:5432/appdb' \
  -e DATABASE_URL=unused -e JWT_SECRET=unused -e PGSSLMODE=require $REPO/api:<sha> alembic stamp head
```

## 8. Prod go-live

1. On the VM, in `/opt/stack`:
   - Put `compose.yml` (from `gcp/compose.prod.yml`), `stack.env` (`APP_HOST`, `API_IMAGE`, `WEB_IMAGE`) and `api.env` there.
   - Fill `api.env` from `gcp/api.prod.env.example`, then `chmod 600 api.env`.
   - Paste the secrets in your own SSH session.
2. Start **api and web only**: `docker compose --env-file stack.env up -d api web`.
3. Check that the API reached the database:

   ```
   docker compose exec web wget -qO- http://api:8000/ready
   ```

   It must answer `{"status":"ok"}`.
4. **Storage gate.** Every line must print PASS:

   ```
   docker compose --env-file stack.env exec -T api python - < storage_check.py
   ```

   It checks keyless signing, the upload and download round trip, the filename, a non-ASCII name, copy and delete.
5. **Change the published admin password before the address exists.**
   - Open a tunnel, with web temporarily published on `127.0.0.1:8080`:

     ```
     gcloud compute ssh prod-app --tunnel-through-iap -- -N -L 8080:127.0.0.1:8080
     ```

   - Sign in as `admin@sourcehub.local` with the seed password and set a new one.
   - Move the admin to a real mailbox, or password resets cannot reach it.
6. Add the `app.<domain>` A record pointing at the prod static IP. Then `docker compose --env-file stack.env up -d caddy`, and wait for "certificate obtained" in its log.
7. Smoke test:
   - `https://app.<domain>/version.json` shows the SHA.
   - Upload a logo and an attachment, then download them.
   - An invitation email arrives.
   - A client's Google Cloud Storage destination passes **Test and save**.
8. The phone app:
   - Set `mobile/src/config.ts` PRODUCTION to `https://app.<domain>` and the staging channel to `https://dev.<domain>`.
   - Run `eas update` for each channel. That reaches only builds with the matching runtime version; older APKs need a rebuild.

## 9. Dev

- **Files:** use the same files with `gcp/compose.dev.yml` and `gcp/api.dev.env.example`. `stack.env` also holds `POSTGRES_PASSWORD`.
- **First boot:** the `db` container initialises with C collation. Load `build/schema.sql`, `build/seed.sql` and `db/910_seed_demo.sql`, which are demo users with the published demo password: dev only.
- **Clocks:** keep mail and push off.
- **Nightly dump to the bucket,** from cron on the VM at 20:30 IST, before the schedule stops it:

  ```
  docker exec db pg_dump -U dbowner -Fc appdb | gcloud storage cp - gs://dm360-dev-files/_backups/appdb-$(date +%F).dump
  ```

## 10. Deploying a new build

1. Build from a committed SHA and push both images to the registry.
2. Compare `docker run --rm $REPO/api:<sha> alembic heads` with `SELECT version_num FROM alembic_version`.
3. If they differ, run the migration first:
   - With `alembic upgrade head` from the **new** image as the database owner. On prod that is postgres over the private IP.
   - In the stopped-API window when the release notes in STAGING.md say so.
4. Set the new tags in `stack.env`, then `docker compose --env-file stack.env up -d`.

## 11. Operations

- **Uptime:** a check on `https://app.<domain>/health`. Not `/ready`: nginx does not forward it, so it would always answer the console's 200.
- **Alerts:** Cloud SQL CPU and disk above 80%.
- **Restore drill:** run once after go-live. Clone to a point in time, compare row counts, then delete the clone:

  ```
  gcloud sql instances clone dm360-prod dm360-drill --point-in-time <UTC time> --project $PROD
  ```

- **Credentials:** rotate the Gmail app password if it was ever shared.
- **Cost:** check spend weekly. The forecast is about ₹7,800 a month for both environments while the dev schedule holds. Clients downloading video is the biggest unknown, at about ₹1,150 per 100 GB.
