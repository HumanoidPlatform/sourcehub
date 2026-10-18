# subject_eval — CLIP vs ML Kit on real captures

An offline test of the phone's subject check (`mobile/src/qa_pipeline/subject/subject.ts`,
ML Kit label words) against CLIP-style image–text models, scored against gate-1 review
outcomes. Background: `docs/research/` (not committed) and the plan this tool came from.

Nothing here runs in the app or the backend. Captures can show bystanders: they are kept
outside the repo and **deleted when the evaluation is done**.

## 1. Export (on the VM)

The VM's database port is deliberately unpublished, so the export runs inside its `api`
container, which already has the `sourcehub` package, the storage credentials and the
network path to `db`. It opens a **READ ONLY** transaction as the database owner (the app
role's row-level security would hide most captures) and writes nothing to the database.

From the laptop, copy the script to the VM (Azure VM shown; on GCP use
`gcloud compute scp ... --tunnel-through-iap`):

    scp tools/subject_eval/export.py azureuser@<vm>:/tmp/export.py

On the VM:

    docker cp /tmp/export.py api:/tmp/export.py
    read -rs PGPW     # the database owner's password, typed, not echoed; write @ as %40
    OWNER=azureuser   # the owner role on this VM (dbowner on GCP)
    docker exec -e DATABASE_ADMIN_URL="postgresql+asyncpg://$OWNER:$PGPW@db:5432/appdb" \
        api python /tmp/export.py --counts-only

The counts are aggregates only and safe to paste back. Then the export itself:

    docker exec -e DATABASE_ADMIN_URL="postgresql+asyncpg://$OWNER:$PGPW@db:5432/appdb" \
        api python /tmp/export.py --out /tmp/subject_eval
    docker cp api:/tmp/subject_eval /tmp/subject_eval
    docker exec api rm -rf /tmp/subject_eval /tmp/export.py
    tar czf /tmp/subject_eval.tgz -C /tmp subject_eval && rm -rf /tmp/subject_eval /tmp/export.py

And back on the laptop, into the data folder (never the repo):

    scp azureuser@<vm>:/tmp/subject_eval.tgz "$LOCALAPPDATA/"
    tar xzf "$LOCALAPPDATA/subject_eval.tgz" -C "$LOCALAPPDATA"
    ssh azureuser@<vm> rm /tmp/subject_eval.tgz

## 2. Score and evaluate (on the laptop)

A virtualenv of its own: torch must not go into the backend's.

    python -m venv tools/subject_eval/.venv
    tools/subject_eval/.venv/Scripts/pip install -r tools/subject_eval/requirements.txt
    tools/subject_eval/.venv/Scripts/python tools/subject_eval/contact_sheet.py
    # look at out/contact_sheet.html; list location-only rejects in exclude_assets.txt
    # and made-up pairs that really match in exclude_pairs.txt (both in the data folder)
    tools/subject_eval/.venv/Scripts/python tools/subject_eval/score_clip.py --model clip-b32
    tools/subject_eval/.venv/Scripts/python tools/subject_eval/evaluate.py

Results go to `%LOCALAPPDATA%\subject_eval\out\` (`report.md`, per-pair scores).
`SUBJECT_EVAL_DATA` overrides the folder.

## 3. Delete

    rm -rf "$LOCALAPPDATA/subject_eval" "$LOCALAPPDATA/subject_eval.tgz"

## Tests

`tests/test_phone_rules.py` holds the Python port of the phone's rules to the phone's own
unit-test cases. Change `phone_rules.py` whenever `subject.ts`, `clip.ts` or the subject
thresholds in `mobile/src/config.ts` change.

    backend/.venv/Scripts/python -m pytest tools/subject_eval/tests
