from __future__ import annotations

import asyncio
import datetime as dt
from dataclasses import dataclass

from sqlalchemy import delete, select

from cosaarthi_mobile.api.security import hash_password
from cosaarthi_mobile.config import settings
from cosaarthi_mobile.db.models import (
    CrowdWorker,
    Notification,
    Organization,
    Permission,
    Role,
    RolePermission,
    Task,
    User,
    UserRole,
)
from cosaarthi_mobile.db.session import SessionLocal


@dataclass(frozen=True, slots=True)
class RoleSeed:
    name: str
    permissions: tuple[str, ...]
    public_signup: bool = False


@dataclass(frozen=True, slots=True)
class UserSeed:
    email: str
    first_name: str
    last_name: str
    phone: str
    locale: str
    organization_kind: str
    role_codes: tuple[str, ...]
    worker_code: str | None = None


@dataclass(frozen=True, slots=True)
class MinioTaskSeed:
    pay: int
    required_upload_count: int


PERMISSIONS = {
    "aggregator:read": "Read aggregator portfolio screens",
    "builder:read": "Read AI Builder workspace",
    "client:read": "Read client workspace",
    "delivery:accept": "Accept governed deliveries",
    "escalation:update": "Acknowledge and update escalations",
    "ide:read": "Read Crowd Visual IDE workspace",
    "kit:allocate": "Allocate device kits",
    "media:capture": "Capture task media on device",
    "partner:read": "Read partner workspace",
    "platform:read": "Read platform governance workspace",
    "profile:update": "Update worker profile",
    "project:publish": "Publish tenant projects",
    "qa:read": "Read QA workspace",
    "qa:review": "Review and decide QA items",
    "rfp:award": "Award client RFPs",
    "sponsor:read": "Read device sponsor workspace",
    "submission:create": "Create task submissions",
    "supply:commit": "Commit partner supply",
    "task:start": "Accept and start a mobile task",
    "tenant:read": "Read tenant workspace",
    "upload:create": "Create direct-to-MinIO uploads",
    "wallet:read": "Read worker wallet",
    "wallet:withdraw": "Request wallet withdrawals",
    "work:read": "Read available and assigned mobile work",
}

ROLE_DEFINITIONS = {
    "aggregator": RoleSeed(
        name="Aggregator",
        permissions=("aggregator:read", "escalation:update"),
    ),
    "builder": RoleSeed(name="AI Builder", permissions=("builder:read",)),
    "client": RoleSeed(
        name="Client",
        permissions=("client:read", "delivery:accept", "rfp:award"),
    ),
    "crowd_worker": RoleSeed(
        name="Crowd Worker",
        permissions=(
            "media:capture",
            "profile:update",
            "submission:create",
            "task:start",
            "upload:create",
            "wallet:read",
            "wallet:withdraw",
            "work:read",
        ),
        public_signup=True,
    ),
    "ide": RoleSeed(
        name="Crowd Visual IDE",
        permissions=("ide:read", "submission:create", "wallet:read"),
    ),
    "partner": RoleSeed(name="Partner", permissions=("partner:read", "supply:commit")),
    "platform": RoleSeed(name="Platform", permissions=("platform:read",)),
    "qa": RoleSeed(name="QA", permissions=("qa:read", "qa:review", "tenant:read")),
    "sponsor": RoleSeed(name="Device Sponsor", permissions=("kit:allocate", "sponsor:read")),
    "tenant": RoleSeed(name="Tenant", permissions=("project:publish", "tenant:read")),
}

ORGANIZATIONS = {
    "aggregator": "Cosaarthi Aggregator Network",
    "builder": "Cosaarthi AI Builder Lab",
    "client": "Cosaarthi Client Studio",
    "crowd_pool": "Cosaarthi Crowd Network",
    "ide": "Cosaarthi Visual IDE",
    "partner": "Cosaarthi Partner Field Ops",
    "platform": "Cosaarthi Command Centre",
    "qa": "Cosaarthi QA Bench",
    "sponsor": "Cosaarthi Device Sponsor Fleet",
    "tenant": "Cosaarthi Tenant Operations",
}

SEEDED_USERS: tuple[UserSeed, ...] = (
    UserSeed(
        email="platform@cosaarthi.local",
        first_name="Platform",
        last_name="Admin",
        phone="+1 555 0100",
        locale="en-US",
        organization_kind="platform",
        role_codes=("platform",),
    ),
    UserSeed(
        email="client@cosaarthi.local",
        first_name="Client",
        last_name="Lead",
        phone="+1 555 0101",
        locale="en-US",
        organization_kind="client",
        role_codes=("client",),
    ),
    UserSeed(
        email="tenant@cosaarthi.local",
        first_name="Tenant",
        last_name="Manager",
        phone="+91 90000 2201",
        locale="en-IN",
        organization_kind="tenant",
        role_codes=("tenant",),
    ),
    UserSeed(
        email="aggregator@cosaarthi.local",
        first_name="Aggregator",
        last_name="Lead",
        phone="+91 90000 2202",
        locale="en-IN",
        organization_kind="aggregator",
        role_codes=("aggregator",),
    ),
    UserSeed(
        email="qa@cosaarthi.local",
        first_name="QA",
        last_name="Reviewer",
        phone="+91 90000 2203",
        locale="en-IN",
        organization_kind="qa",
        role_codes=("qa",),
    ),
    UserSeed(
        email="partner@cosaarthi.local",
        first_name="Partner",
        last_name="Coordinator",
        phone="+91 90000 3098",
        locale="en-IN",
        organization_kind="partner",
        role_codes=("partner",),
    ),
    UserSeed(
        email="device@cosaarthi.local",
        first_name="Device",
        last_name="Sponsor",
        phone="+91 90000 4100",
        locale="en-IN",
        organization_kind="sponsor",
        role_codes=("sponsor",),
    ),
    UserSeed(
        email="crowd@cosaarthi.local",
        first_name="Crowd",
        last_name="Worker",
        phone="+91 90000 7001",
        locale="en-IN",
        organization_kind="crowd_pool",
        role_codes=("crowd_worker",),
        worker_code="COSAARTHI-CROWD-LOCAL",
    ),
    UserSeed(
        email="ide@cosaarthi.local",
        first_name="Visual",
        last_name="IDE",
        phone="+91 90000 7002",
        locale="en-IN",
        organization_kind="ide",
        role_codes=("ide",),
    ),
    UserSeed(
        email="builder@cosaarthi.local",
        first_name="AI",
        last_name="Builder",
        phone="+1 555 0108",
        locale="en-US",
        organization_kind="builder",
        role_codes=("builder",),
    ),
    UserSeed(
        email="anita@crowd.in",
        first_name="Anita",
        last_name="Rao",
        phone="+91 90000 7007",
        locale="en-IN",
        organization_kind="crowd_pool",
        role_codes=("crowd_worker",),
        worker_code="COSAARTHI-CROWD",
    ),
    UserSeed(
        email="multi@cosaarthi.local",
        first_name="Multi",
        last_name="Persona",
        phone="+91 90000 8000",
        locale="en-IN",
        organization_kind="tenant",
        role_codes=("tenant", "aggregator", "qa", "crowd_worker"),
        worker_code="COSAARTHI-MULTI",
    ),
)


async def _upsert_organizations(session) -> dict[str, Organization]:
    rows: dict[str, Organization] = {}
    for kind, name in ORGANIZATIONS.items():
        row = await session.scalar(select(Organization).where(Organization.kind == kind))
        if row is None:
            row = Organization(kind=kind, name=name, status="active")
            session.add(row)
        else:
            row.name = name
            row.status = "active"
        rows[kind] = row
    await session.flush()
    return rows


async def _upsert_permissions(session) -> dict[str, Permission]:
    rows: dict[str, Permission] = {}
    for code, description in PERMISSIONS.items():
        row = await session.scalar(select(Permission).where(Permission.code == code))
        if row is None:
            row = Permission(code=code, description=description)
            session.add(row)
        else:
            row.description = description
        rows[code] = row
    await session.flush()
    return rows


async def _upsert_roles(
    session,
    permissions: dict[str, Permission],
) -> dict[str, Role]:
    roles: dict[str, Role] = {}
    for code, definition in ROLE_DEFINITIONS.items():
        role = await session.scalar(select(Role).where(Role.code == code))
        if role is None:
            role = Role(code=code, name=definition.name, public_signup=definition.public_signup)
            session.add(role)
        else:
            role.name = definition.name
            role.public_signup = definition.public_signup
        roles[code] = role
    await session.flush()

    for code, definition in ROLE_DEFINITIONS.items():
        role = roles[code]
        wanted_permission_ids = {
            permissions[permission_code].id for permission_code in definition.permissions
        }
        existing_permission_ids = set(
            (
                await session.scalars(
                    select(RolePermission.permission_id).where(RolePermission.role_id == role.id)
                )
            ).all()
        )
        for permission_id in wanted_permission_ids - existing_permission_ids:
            session.add(RolePermission(role_id=role.id, permission_id=permission_id))
    await session.flush()
    return roles


async def _upsert_user(
    session,
    user_seed: UserSeed,
    organizations: dict[str, Organization],
    roles: dict[str, Role],
    password_hash: str,
) -> User:
    email = user_seed.email.lower()
    user = await session.scalar(select(User).where(User.email == email))
    organization = organizations[user_seed.organization_kind]
    if user is None:
        user = User(
            email=email,
            first_name=user_seed.first_name,
            last_name=user_seed.last_name,
            locale=user_seed.locale,
            organization_id=organization.id,
            password_hash=password_hash,
            phone=user_seed.phone,
            status="active",
        )
        session.add(user)
        await session.flush()
    else:
        user.first_name = user_seed.first_name
        user.last_name = user_seed.last_name
        user.locale = user_seed.locale
        user.organization_id = organization.id
        user.password_hash = password_hash
        user.phone = user_seed.phone
        user.status = "active"

    target_role_ids = {roles[role_code].id for role_code in user_seed.role_codes}
    await session.execute(
        delete(UserRole).where(
            UserRole.user_id == user.id,
            UserRole.role_id.notin_(target_role_ids),
        )
    )
    existing_role_ids = set(
        (await session.scalars(select(UserRole.role_id).where(UserRole.user_id == user.id))).all()
    )
    for role_id in target_role_ids - existing_role_ids:
        session.add(UserRole(user_id=user.id, role_id=role_id))

    if user_seed.worker_code:
        worker = await session.scalar(select(CrowdWorker).where(CrowdWorker.user_id == user.id))
        display_name = f"{user_seed.first_name} {user_seed.last_name}".strip()
        if worker is None:
            session.add(
                CrowdWorker(
                    display_name=display_name,
                    user_id=user.id,
                    worker_code=user_seed.worker_code,
                    status="active",
                )
            )
        else:
            worker.display_name = display_name
            worker.status = "active"
            worker.worker_code = user_seed.worker_code

        notification = await session.scalar(
            select(Notification).where(
                Notification.title == "Local verification task ready",
                Notification.user_id == user.id,
            )
        )
        if notification is None:
            session.add(
                Notification(
                    body=(
                        "Upload the local photo task images to validate the mobile "
                        "PostgreSQL and MinIO stack."
                    ),
                    deep_link="/work",
                    title="Local verification task ready",
                    tone="info",
                    user_id=user.id,
                )
            )

    await session.flush()
    return user


MINIO_TASK_SEEDS: tuple[MinioTaskSeed, ...] = (
    MinioTaskSeed(pay=75, required_upload_count=3),
    MinioTaskSeed(pay=125, required_upload_count=5),
)


async def _upsert_minio_tasks(session) -> None:
    for seed in MINIO_TASK_SEEDS:
        count = seed.required_upload_count
        task_code = f"TASK-MINIO-{count}"
        task_fields = {
            "allowed_file_types": ["jpg", "jpeg", "png"],
            "campaign_id": "campaign-minio-upload-test",
            "category": "Storage / MinIO",
            "checklist": [
                f"Upload exactly {count} jpg, jpeg or png images.",
                "Wait for each image to reach uploaded before submitting the task.",
                "Retry failed images from the task progress panel.",
            ],
            "currency": "INR",
            "description": (
                f"Upload exactly {count} images to verify that mobile MinIO storage "
                "and the upload flow are working correctly."
            ),
            "difficulty": "starter",
            "due_at": dt.datetime.now(dt.UTC) + dt.timedelta(days=1),
            "estimated_minutes": 10,
            "location": "Expo Go test device",
            "pay": seed.pay,
            "progress": 0,
            "project": "MinIO Upload Reliability Test",
            "quality_bar": (
                f"{count} distinct images, successful upload status for each item, "
                "and no duplicate upload records on retry."
            ),
            "required_media": ["image"],
            "required_upload_count": count,
            "slots_remaining": 100,
            "status": "available",
            "storage_bucket": settings.minio_bucket_media,
            "task_code": task_code,
            "task_type": "capture",
            "title": f"Upload {count} Photos",
        }
        task = await session.scalar(select(Task).where(Task.task_code == task_code))
        if task is None:
            session.add(Task(**task_fields))
        else:
            for key, value in task_fields.items():
                setattr(task, key, value)
    await session.flush()


async def seed() -> None:
    async with SessionLocal() as session:
        organizations = await _upsert_organizations(session)
        permissions = await _upsert_permissions(session)
        roles = await _upsert_roles(session, permissions)
        password_hash = hash_password(settings.dev_seed_password.get_secret_value())

        for user_seed in SEEDED_USERS:
            await _upsert_user(session, user_seed, organizations, roles, password_hash)

        await _upsert_minio_tasks(session)
        await session.commit()


def main() -> None:
    asyncio.run(seed())


if __name__ == "__main__":
    main()
