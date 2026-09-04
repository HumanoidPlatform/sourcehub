from __future__ import annotations

import argparse
import asyncio
import base64
import json
import os
import uuid
from pathlib import Path
from typing import Any

import asyncpg
import httpx
from minio import Minio
from minio.error import S3Error

TASK_ID = "TASK-MINIO-3"
EXPECTED_UPLOAD_COUNT = 3
TEST_PASSWORD = "Cosaarthi#2026"
EXPECTED_USERS = {
    "platform@cosaarthi.local": ["platform"],
    "client@cosaarthi.local": ["client"],
    "tenant@cosaarthi.local": ["tenant"],
    "aggregator@cosaarthi.local": ["aggregator"],
    "qa@cosaarthi.local": ["qa"],
    "partner@cosaarthi.local": ["partner"],
    "device@cosaarthi.local": ["sponsor"],
    "crowd@cosaarthi.local": ["crowd"],
    "ide@cosaarthi.local": ["ide"],
    "builder@cosaarthi.local": ["builder"],
    "anita@crowd.in": ["crowd"],
    "multi@cosaarthi.local": ["tenant", "aggregator", "qa", "crowd"],
}
PNG_BYTES = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB"
    "/6X8WQAAAABJRU5ErkJggg=="
)


def load_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        clean = line.strip()
        if not clean or clean.startswith("#") or "=" not in clean:
            continue
        key, value = clean.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def asyncpg_url(url: str) -> str:
    return url.replace("postgresql+asyncpg://", "postgresql://", 1)


def env_bool(value: str | None) -> bool:
    return str(value or "").strip().lower() in {"1", "true", "yes", "on"}


async def request_json(
    client: httpx.AsyncClient,
    method: str,
    url: str,
    *,
    expected_status: int | None = None,
    headers: dict[str, str] | None = None,
    json_body: dict[str, Any] | None = None,
) -> dict[str, Any]:
    response = await client.request(method, url, headers=headers, json=json_body)
    if expected_status is not None:
        if response.status_code != expected_status:
            raise AssertionError(
                f"{method} {url} returned {response.status_code}, expected "
                f"{expected_status}: {response.text}"
            )
    else:
        response.raise_for_status()
    if response.status_code == 204:
        return {}
    return response.json()


async def login_and_assert(
    client: httpx.AsyncClient,
    base_url: str,
    email: str,
    expected_personas: list[str],
) -> dict[str, Any]:
    session = await request_json(
        client,
        "POST",
        f"{base_url}/auth/login",
        json_body={"email": email, "password": TEST_PASSWORD},
    )
    user = session["user"]
    if user["email"] != email:
        raise AssertionError(f"{email} login returned mismatched user {user['email']}")
    if user["availablePersonas"] != expected_personas:
        raise AssertionError(
            f"{email} personas were {user['availablePersonas']}, expected {expected_personas}"
        )
    if user["persona"] != expected_personas[0]:
        raise AssertionError(f"{email} primary persona was {user['persona']}")
    return session


async def verify_signup(
    client: httpx.AsyncClient,
    base_url: str,
    run_id: str,
) -> dict[str, Any]:
    email = f"signup-{run_id}@crowd.in"
    body = {
        "email": email,
        "firstName": "Signup",
        "lastName": "Verifier",
        "password": TEST_PASSWORD,
        "phone": "+91 90000 9090",
        "termsAccepted": True,
    }
    signup_session = await request_json(
        client,
        "POST",
        f"{base_url}/auth/signup",
        json_body=body,
    )
    signup_user = signup_session["user"]
    if signup_user["persona"] != "crowd" or signup_user["availablePersonas"] != ["crowd"]:
        raise AssertionError(f"Signup assigned unexpected personas: {signup_user}")

    duplicate = await request_json(
        client,
        "POST",
        f"{base_url}/auth/signup",
        expected_status=409,
        json_body=body,
    )
    if "already exists" not in str(duplicate.get("detail", "")):
        raise AssertionError(f"Duplicate signup did not return a clean conflict: {duplicate}")

    login_session = await login_and_assert(client, base_url, email, ["crowd"])
    return {
        "email": email,
        "session": login_session,
        "signupSessionUserId": signup_user["id"],
    }


async def verify_persona_switch(
    client: httpx.AsyncClient,
    base_url: str,
    multi_session: dict[str, Any],
) -> list[str]:
    selected: list[str] = []
    auth_headers = {"Authorization": f"Bearer {multi_session['accessToken']}"}
    for persona in ["aggregator", "qa", "crowd", "tenant"]:
        switched = await request_json(
            client,
            "POST",
            f"{base_url}/auth/persona",
            headers=auth_headers,
            json_body={"persona": persona},
        )
        if switched["user"]["persona"] != persona:
            raise AssertionError(f"Switch to {persona} returned {switched['user']['persona']}")
        if switched["user"]["availablePersonas"] != EXPECTED_USERS["multi@cosaarthi.local"]:
            raise AssertionError(f"Switch to {persona} changed assigned personas")
        selected.append(persona)
        auth_headers = {"Authorization": f"Bearer {switched['accessToken']}"}
    return selected


async def verify_minio_upload(
    client: httpx.AsyncClient,
    base_url: str,
    session: dict[str, Any],
    run_id: str,
) -> dict[str, Any]:
    auth_headers = {"Authorization": f"Bearer {session['accessToken']}"}
    task = await request_json(
        client,
        "POST",
        f"{base_url}/mobile/crowd/tasks/{TASK_ID}/start",
        headers=auth_headers,
    )
    required_upload_count = task.get("requiredUploadCount")
    if required_upload_count != EXPECTED_UPLOAD_COUNT:
        raise AssertionError(
            f"{TASK_ID} requiredUploadCount was {required_upload_count}, "
            f"expected {EXPECTED_UPLOAD_COUNT}"
        )

    object_keys: list[str] = []
    for slot in range(1, required_upload_count + 1):
        idempotency_key = f"verify-{run_id}-{slot}"
        presign = await request_json(
            client,
            "POST",
            f"{base_url}/mobile/crowd/uploads/presign",
            headers=auth_headers,
            json_body={
                "fileName": f"verify-{slot:03d}.png",
                "idempotencyKey": idempotency_key,
                "kind": "image",
                "mimeType": "image/png",
                "sizeBytes": len(PNG_BYTES),
                "taskId": TASK_ID,
            },
        )
        put_response = await client.put(
            presign["uploadUrl"],
            content=PNG_BYTES,
            headers=presign["headers"],
        )
        put_response.raise_for_status()
        confirmed = await request_json(
            client,
            "POST",
            f"{base_url}/mobile/crowd/uploads/confirm",
            headers=auth_headers,
            json_body={
                "idempotencyKey": idempotency_key,
                "taskId": TASK_ID,
                "uploadId": presign["uploadId"],
            },
        )
        object_keys.append(confirmed["objectKey"])

    submission = await request_json(
        client,
        "POST",
        f"{base_url}/actions/submission.create",
        headers={**auth_headers, "Idempotency-Key": f"verify-final-{run_id}"},
        json_body={
            "idempotencyKey": f"verify-final-{run_id}",
            "meta": {
                "bucket": "cosaarthi-mobile-media",
                "objectKeys": object_keys,
                "uploadedCount": len(object_keys),
                "requiredUploadCount": required_upload_count,
            },
            "payloadRef": f"minio://cosaarthi-mobile-media/{TASK_ID}",
            "projectId": "MinIO Upload Reliability Test",
            "taskId": TASK_ID,
            "type": "capture",
        },
    )
    return {
        "firstObjectKey": object_keys[0],
        "objectKeyCount": len(object_keys),
        "objectKeys": object_keys,
        "requiredUploadCount": required_upload_count,
        "submission": submission,
    }


def verify_minio_objects(env: dict[str, str], object_keys: list[str]) -> dict[str, Any]:
    bucket = env.get("MINIO_BUCKET_MEDIA", "cosaarthi-mobile-media")
    client = Minio(
        endpoint=env.get("MINIO_ENDPOINT", "127.0.0.1:59000"),
        access_key=env.get("MINIO_ACCESS_KEY", "cosaarthi"),
        secret_key=env.get("MINIO_SECRET_KEY", "cosaarthi_mobile_dev_password"),
        secure=env_bool(env.get("MINIO_SECURE")),
        region=env.get("MINIO_REGION", "us-east-1"),
    )
    present_keys: list[str] = []
    for object_key in object_keys:
        try:
            client.stat_object(bucket, object_key)
        except S3Error as exc:
            raise AssertionError(f"MinIO object was not found: {object_key}") from exc
        present_keys.append(object_key)
    return {
        "bucket": bucket,
        "objectCount": len(present_keys),
    }


async def verify_postgres(
    db_url: str,
    signup_email: str,
    signup_user_id: str,
    object_keys: list[str],
    task_id: str,
) -> dict[str, Any]:
    conn = await asyncpg.connect(asyncpg_url(db_url))
    try:
        seed_rows = await conn.fetch(
            """
            SELECT u.email, array_agg(r.code ORDER BY r.code) AS role_codes
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE u.email = ANY($1::text[])
            GROUP BY u.id, u.email
            """,
            list(EXPECTED_USERS),
        )
        if len(seed_rows) != len(EXPECTED_USERS):
            found = {row["email"] for row in seed_rows}
            missing = sorted(set(EXPECTED_USERS) - found)
            raise AssertionError(f"Seeded users missing in PostgreSQL: {missing}")

        signup_row = await conn.fetchrow(
            """
            SELECT u.email, u.password_hash, array_agg(r.code ORDER BY r.code) AS role_codes
            FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE u.email = $1
            GROUP BY u.id, u.email, u.password_hash
            """,
            signup_email,
        )
        if signup_row is None:
            raise AssertionError("Signup user was not found in PostgreSQL")
        password_hash = signup_row["password_hash"]
        if password_hash == TEST_PASSWORD or not password_hash.startswith("$argon2"):
            raise AssertionError("Signup password is not stored as an Argon2 hash")
        if signup_row["role_codes"] != ["crowd_worker"]:
            raise AssertionError(f"Signup roles were {signup_row['role_codes']}")

        asset_count = await conn.fetchval(
            """
            SELECT count(*)
            FROM assets
            JOIN tasks ON tasks.id = assets.task_id
            WHERE user_id = $1::uuid
              AND object_key = ANY($2::text[])
              AND tasks.task_code = $3
              AND assets.status = 'uploaded'
            """,
            signup_user_id,
            object_keys,
            task_id,
        )
        if asset_count != len(object_keys):
            raise AssertionError(
                f"Only {asset_count} of {len(object_keys)} uploaded objects matched "
                "PostgreSQL assets"
            )

        submitted_asset_count = await conn.fetchval(
            """
            SELECT count(*)
            FROM assets
            JOIN tasks ON tasks.id = assets.task_id
            WHERE user_id = $1::uuid
              AND object_key = ANY($2::text[])
              AND tasks.task_code = $3
              AND submission_id IS NOT NULL
            """,
            signup_user_id,
            object_keys,
            task_id,
        )
        if submitted_asset_count != len(object_keys):
            raise AssertionError(
                f"Only {submitted_asset_count} of {len(object_keys)} assets were linked "
                "to a submission"
            )

        return {
            "assetRows": asset_count,
            "newUserEmail": signup_email,
            "newUserRoleCodes": signup_row["role_codes"],
            "passwordHashPrefix": signup_row["password_hash"][:9],
            "seededUserRows": len(seed_rows),
            "submittedAssetRows": submitted_asset_count,
            "taskId": task_id,
        }
    finally:
        await conn.close()


async def verify(base_url: str, db_url: str, env: dict[str, str]) -> dict[str, Any]:
    run_id = uuid.uuid4().hex[:12]
    async with httpx.AsyncClient(timeout=30.0) as client:
        seeded_logins: dict[str, list[str]] = {}
        multi_session: dict[str, Any] | None = None
        for email, personas in EXPECTED_USERS.items():
            session = await login_and_assert(client, base_url, email, personas)
            seeded_logins[email] = session["user"]["availablePersonas"]
            if email == "multi@cosaarthi.local":
                multi_session = session

        if multi_session is None:
            raise AssertionError("Multi-role session was not verified")

        switched_personas = await verify_persona_switch(client, base_url, multi_session)
        signup = await verify_signup(client, base_url, run_id)
        minio = await verify_minio_upload(client, base_url, signup["session"], run_id)
        minio_objects = verify_minio_objects(env, minio["objectKeys"])
        postgres = await verify_postgres(
            db_url,
            signup["email"],
            signup["session"]["user"]["id"],
            minio["objectKeys"],
            TASK_ID,
        )

        return {
            "auth": "ok",
            "baseUrl": base_url,
            "minio": {
                "bucket": minio_objects["bucket"],
                "firstObjectKey": minio["firstObjectKey"],
                "objectCount": minio_objects["objectCount"],
                "objectKeyCount": minio["objectKeyCount"],
                "requiredUploadCount": minio["requiredUploadCount"],
                "submission": minio["submission"],
            },
            "personaSwitching": switched_personas,
            "postgres": postgres,
            "seededLogins": seeded_logins,
            "signup": {
                "duplicateRejected": True,
                "email": signup["email"],
                "loginAfterSignup": "ok",
                "persona": "crowd",
            },
            "taskId": TASK_ID,
        }


def main() -> None:
    backend_dir = Path(__file__).resolve().parents[1]
    env = {**load_dotenv(backend_dir / ".env"), **os.environ}
    parser = argparse.ArgumentParser(description="Verify the Cosaarthi mobile local backend")
    parser.add_argument("--base-url", default=env.get("VERIFY_API_URL", "http://127.0.0.1:8001/api/v1"))
    parser.add_argument(
        "--database-url",
        default=env.get("DATABASE_ADMIN_URL") or env.get("DATABASE_URL"),
    )
    args = parser.parse_args()

    if not args.database_url:
        raise SystemExit("DATABASE_URL or DATABASE_ADMIN_URL is required")

    result = asyncio.run(verify(args.base_url.rstrip("/"), args.database_url, env))
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
