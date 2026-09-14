"""The client chooses where captures are delivered: S3/MinIO or Azure.

This partly UNDOES 0010, deliberately. 0010 reconstructed the deployed schema,
which had narrowed client delivery destinations to Azure Blob only and dropped
the region column that S3 signing needs. That narrowing was not wanted: a
client names their own storage when raising an RFP, and it is theirs to choose.

What does NOT change is the platform's own storage — request attachments,
sample files, method statements, QA evidence. That is SourceHub's container,
it is Azure, and there is no longer any setting that says otherwise. The two
were conflated; this is the half that stays fixed.

region comes back because s3_store passes it to the SDK to keep signing off the
network: without it the client issues a live GetBucketLocation before it will
sign anything, and SigV4 against a bucket outside us-east-1 is refused. That is
the fault fixed in "Signing a URL should not need the network"; dropping the
column reintroduced it for every S3 destination.

The storage_provider enum keeps its unused 'gcs' label. Postgres cannot drop an
enum value without rewriting the column that uses it, and a CHECK says the same
thing in one line. The gcs adapter is deleted in this change.

Revision ID: 0011
Revises: 0010
"""

from alembic import op

revision = "0011"
down_revision = "0010"


def upgrade() -> None:
    op.execute("ALTER TABLE storage_target DROP CONSTRAINT storage_target_azure_only")
    op.execute("ALTER TABLE storage_target ADD COLUMN region text")
    op.execute(
        "ALTER TABLE storage_target ADD CONSTRAINT storage_target_provider_supported "
        "CHECK (provider IN ('s3','azure_blob'))"
    )


def downgrade() -> None:
    """Back to Azure-only destinations.

    Fails loudly rather than silently, if any live target is S3 by then: the
    old constraint exempts soft-deleted rows only, so a live S3 destination
    would make the ADD CONSTRAINT refuse. That is the right outcome — the
    alternative is deleting a client's destination to satisfy a downgrade.

    region is dropped with its contents. Like 0010's downgrade, this restores
    the shape and not the data, and the column returns at the end of the table
    rather than where it was.
    """
    op.execute("ALTER TABLE storage_target DROP CONSTRAINT storage_target_provider_supported")
    op.execute("ALTER TABLE storage_target DROP COLUMN region")
    op.execute(
        "ALTER TABLE storage_target ADD CONSTRAINT storage_target_azure_only "
        "CHECK (provider = 'azure_blob' OR deleted_at IS NOT NULL)"
    )
