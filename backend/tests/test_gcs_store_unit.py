"""The native Google Cloud Storage adapter, offline.

Signing is checked for real: a throwaway RSA key in a service-account-shaped
dict signs V4 URLs locally, with no network, so the URL's shape (algorithm,
expiry, signed headers, encoded key, pinned disposition) is what Google would
verify. Everything that talks to Google is checked against a fake client, for
what the adapter turns each failure into — callers show these messages to
clients, and turn LookupError into "never uploaded".
"""

from __future__ import annotations

import json
from types import SimpleNamespace
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

import httpx
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from google.api_core.exceptions import Forbidden, NotFound
from google.auth.exceptions import RefreshError

from sourcehub.platform import storage
from sourcehub.platform.storage import gcs_store
from sourcehub.platform.storage.types import StorageError, StorageTarget


@pytest.fixture(scope="module")
def key_info() -> dict[str, Any]:
    pem = rsa.generate_private_key(public_exponent=65537, key_size=2048).private_bytes(
        serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
    )
    return {
        "type": "service_account",
        "project_id": "dm360-test",
        "private_key_id": "0123456789abcdef",
        "private_key": pem.decode(),
        "client_email": "uploader@dm360-test.iam.gserviceaccount.com",
        "client_id": "1",
        "token_uri": "https://oauth2.googleapis.com/token",
    }


@pytest.fixture(autouse=True)
def _fresh_clients():
    gcs_store._CLIENTS.clear()
    yield
    gcs_store._CLIENTS.clear()


def _target(info: dict[str, Any] | None, **kw: Any) -> StorageTarget:
    secret = {"service_account_json": json.dumps(info)} if info is not None else {}
    bucket = kw.pop("bucket", "dm360-dev-files")
    return StorageTarget(provider="gcs", bucket=bucket, secret=secret, **kw)


# ---------------------------------------------------------------------------
# Real V4 signing with a key, offline
# ---------------------------------------------------------------------------
async def test_presigned_put_is_a_v4_url_with_no_extra_headers(key_info):
    key = "Acme Retail/RFP-1001/brief/my report #2 (final).pdf"
    url, headers = await storage.presign_put(_target(key_info), key)
    assert headers == {}, "GCS needs nothing like Azure's x-ms-blob-type"
    u = urlparse(url)
    q = parse_qs(u.query)
    assert u.scheme == "https" and u.netloc == "storage.googleapis.com"
    assert unquote(u.path) == "/dm360-dev-files/Acme Retail/RFP-1001/brief/my report #2 (final).pdf"
    assert "#" not in u.path and " " not in u.path, "the key must be percent-encoded"
    assert q["X-Goog-Algorithm"] == ["GOOG4-RSA-SHA256"]
    assert q["X-Goog-Expires"] == ["900"]
    assert q["X-Goog-SignedHeaders"] == ["host"], "Content-Type stays unsigned, as on S3"
    assert q["X-Goog-Credential"][0].startswith("uploader@dm360-test.iam.gserviceaccount.com/")


async def test_presigned_get_pins_the_disposition(key_info):
    url = await storage.presign_get(_target(key_info), "a/b.pdf", "my report #2 (final).pdf")
    q = parse_qs(urlparse(url).query)
    assert q["response-content-disposition"] == ['attachment; filename="my report #2 (final).pdf"']
    url = await storage.presign_get(_target(key_info), "a/b.jpg", "shelf.jpg", inline=True)
    q = parse_qs(urlparse(url).query)
    assert q["response-content-disposition"] == ['inline; filename="shelf.jpg"']


async def test_a_public_endpoint_is_the_host_signed_for(key_info):
    t = _target(key_info, public_endpoint="https://gcs.example.test")
    url, _ = await storage.presign_put(t, "k")
    assert urlparse(url).netloc == "gcs.example.test"


async def test_the_key_may_arrive_as_a_dict(key_info):
    secret = {"service_account_json": key_info}
    t = StorageTarget(provider="gcs", bucket="dm360-dev-files", secret=secret)
    url, _ = await storage.presign_put(t, "k")
    assert "X-Goog-Signature=" in url


async def test_one_client_per_credential(key_info):
    a_client, a_creds = gcs_store._client(_target(key_info))
    b_client, b_creds = gcs_store._client(_target(key_info))
    assert a_client is b_client and a_creds is b_creds


# ---------------------------------------------------------------------------
# Refusals before any network call
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("bucket", ["No Such Bucket!", "ab", "UPPER", "-lead", "a" * 64])
async def test_an_invalid_bucket_name_is_refused(key_info, bucket):
    with pytest.raises(StorageError, match="not a valid Google Cloud Storage bucket name"):
        await storage.presign_put(_target(key_info, bucket=bucket), "k")


@pytest.mark.parametrize(
    ("secret", "message"),
    [
        ({"service_account_json": "{not json"}, "not valid JSON"),
        ({"service_account_json": json.dumps({"type": "authorized_user"})},
         "not a service account key"),
        ({"service_account_json": json.dumps({"type": "service_account", "client_email": "x"})},
         "missing its client_email or private_key"),
    ],
)
async def test_a_bad_key_is_named_not_echoed(secret, message):
    t = StorageTarget(provider="gcs", bucket="dm360-dev-files", secret=secret)
    with pytest.raises(StorageError, match=message) as e:
        await storage.presign_put(t, "k")
    assert "BEGIN PRIVATE KEY" not in str(e.value)


async def test_a_key_that_cannot_sign_is_a_storageerror(key_info):
    pem = "-----BEGIN PRIVATE KEY-----\nnope\n-----END PRIVATE KEY-----\n"
    broken = dict(key_info, private_key=pem)
    with pytest.raises(StorageError) as e:
        await storage.presign_put(_target(broken), "k")
    assert "nope" not in str(e.value)


def test_the_target_never_prints_its_key(key_info):
    assert "PRIVATE KEY" not in repr(_target(key_info))


# ---------------------------------------------------------------------------
# Keyless signing (the platform on a GCP VM)
# ---------------------------------------------------------------------------
class _Creds:
    def __init__(self) -> None:
        self.valid = False
        self.token: str | None = None
        self.service_account_email = "prod-vm@dm360-prod.iam.gserviceaccount.com"
        self.refreshed = 0

    def refresh(self, _request: Any) -> None:
        self.refreshed += 1
        self.valid, self.token = True, "ya29.test-token"


class _SigningBlob:
    def __init__(self) -> None:
        self.kw: dict[str, Any] = {}

    def generate_signed_url(self, **kw: Any) -> str:
        self.kw = kw
        return "https://storage.googleapis.com/signed"


async def test_keyless_signs_through_iam_with_the_vm_account(monkeypatch):
    creds, blob = _Creds(), _SigningBlob()
    client = SimpleNamespace(bucket=lambda _name: SimpleNamespace(blob=lambda _key: blob))
    monkeypatch.setattr(gcs_store, "_client", lambda _t: (client, creds))
    url, headers = await storage.presign_put(_target(None), "k")
    assert (url, headers) == ("https://storage.googleapis.com/signed", {})
    assert creds.refreshed == 1
    assert blob.kw["service_account_email"] == "prod-vm@dm360-prod.iam.gserviceaccount.com"
    assert blob.kw["access_token"] == "ya29.test-token"
    assert blob.kw["version"] == "v4" and blob.kw["method"] == "PUT"
    await storage.presign_get(_target(None), "k", "f.pdf")
    assert creds.refreshed == 1, "a valid token is reused, not refreshed per URL"


async def test_keyless_without_credentials_says_what_is_missing(monkeypatch):
    from google.auth.exceptions import DefaultCredentialsError

    def none(*_a: Any, **_k: Any) -> Any:
        raise DefaultCredentialsError("nothing here")

    monkeypatch.setattr(gcs_store.google.auth, "default", none)
    with pytest.raises(StorageError, match="No Google credentials are available here"):
        await storage.presign_put(_target(None), "k")


# ---------------------------------------------------------------------------
# What each failure from Google becomes
# ---------------------------------------------------------------------------
class _Writer:
    """What blob.open("wb") hands back: a resumable upload behind a file."""

    def __init__(self, blob: _Blob) -> None:
        self.blob = blob

    def __enter__(self) -> _Writer:
        return self

    def __exit__(self, *_: Any) -> None:
        return None

    def write(self, data: bytes) -> int:
        self.blob.written += data
        return len(data)


class _Blob:
    def __init__(self, fail: Exception | None = None, size: int = 7) -> None:
        self.fail, self.size = fail, size
        self.content_type, self.etag = "application/pdf", '"abc123"'
        self.calls: list[tuple[str, dict[str, Any]]] = []
        self.written = bytearray()

    def open(self, mode: str, **kw: Any) -> _Writer:
        self.calls.append(("open", {"mode": mode, **kw}))
        if self.fail:
            raise self.fail
        return _Writer(self)

    def reload(self, **kw: Any) -> None:
        self.calls.append(("reload", kw))
        if self.fail:
            raise self.fail

    def delete(self, **kw: Any) -> None:
        self.calls.append(("delete", kw))
        if self.fail:
            raise self.fail


class _Bucket:
    def __init__(self, blob: _Blob, copy_fail: Exception | None = None) -> None:
        self._blob, self.copy_fail = blob, copy_fail
        self.copies: list[tuple[Any, ...]] = []

    def blob(self, _key: str) -> _Blob:
        return self._blob

    def copy_blob(self, src: Any, dest_bucket: Any, new_name: str, **kw: Any) -> None:
        self.copies.append((src, dest_bucket, new_name, kw))
        if self.copy_fail:
            raise self.copy_fail


def _fake(monkeypatch: pytest.MonkeyPatch, bucket: _Bucket) -> None:
    client = SimpleNamespace(bucket=lambda _name: bucket)
    monkeypatch.setattr(gcs_store, "_client", lambda _t: (client, None))


async def test_head_reports_what_storage_holds(monkeypatch, key_info):
    blob = _Blob()
    _fake(monkeypatch, _Bucket(blob))
    s = await storage.head(_target(key_info), "k")
    assert (s.size, s.content_type, s.etag) == (7, "application/pdf", "abc123")
    assert blob.calls[0][1] == {"timeout": (5, 30), "retry": None}, "fail fast, no hidden retries"


async def test_a_missing_object_is_lookuperror(monkeypatch, key_info):
    _fake(monkeypatch, _Bucket(_Blob(NotFound("No such object: dm360-dev-files/k"))))
    with pytest.raises(LookupError):
        await storage.head(_target(key_info), "k")


async def test_a_missing_bucket_is_not_a_missing_file(monkeypatch, key_info):
    _fake(monkeypatch, _Bucket(_Blob(NotFound("The specified bucket does not exist."))))
    with pytest.raises(StorageError, match="does not exist"):
        await storage.head(_target(key_info), "k")


async def test_copy_is_server_side_within_the_bucket(monkeypatch, key_info):
    bucket = _Bucket(_Blob())
    _fake(monkeypatch, bucket)
    await storage.copy(_target(key_info), "_staging/a.pdf", "Acme/RFP-1001/brief/a.pdf")
    _src, dest_bucket, new_name, kw = bucket.copies[0]
    assert dest_bucket is bucket and new_name == "Acme/RFP-1001/brief/a.pdf"
    assert kw == {"timeout": (5, 30), "retry": None}


async def test_copying_a_missing_object_is_lookuperror(monkeypatch, key_info):
    _fake(monkeypatch, _Bucket(_Blob(), copy_fail=NotFound("No such object")))
    with pytest.raises(LookupError):
        await storage.copy(_target(key_info), "a", "b")


async def test_deleting_what_is_already_gone_succeeds(monkeypatch, key_info):
    _fake(monkeypatch, _Bucket(_Blob(NotFound("No such object"))))
    await storage.delete(_target(key_info), "k")


@pytest.mark.parametrize(
    ("error", "message"),
    [
        (RefreshError("invalid_grant: secret material"), "Google refused the credential."),
        (Forbidden("403 caller lacks storage.objects.delete"), "has no access to the bucket"),
        (ConnectionError("dns failure"), "Could not reach storage.googleapis.com: ConnectionError"),
    ],
)
async def test_failures_become_messages_a_client_may_read(monkeypatch, key_info, error, message):
    _fake(monkeypatch, _Bucket(_Blob(error)))
    with pytest.raises(StorageError, match=message) as e:
        await storage.delete(_target(key_info), "k")
    assert "secret material" not in str(e.value) and "dns failure" not in str(e.value)


async def test_verify_writes_reads_signs_and_cleans_up(monkeypatch, key_info):
    events: list[str] = []

    class _ProbeBlob(_Blob):
        def upload_from_string(self, body: bytes, **kw: Any) -> None:
            events.append("upload")
            self.body = body

        def download_as_bytes(self, **kw: Any) -> bytes:
            events.append("download")
            return self.body

        def delete(self, **kw: Any) -> None:
            events.append("delete")

    blob = _ProbeBlob()
    _fake(monkeypatch, _Bucket(blob))
    monkeypatch.setattr(gcs_store, "_sign", lambda *a, **k: events.append("sign") or "u")
    await storage.verify(_target(key_info))
    assert events == ["upload", "download", "sign", "delete"]


async def test_verify_says_which_role_is_missing(monkeypatch, key_info):
    class _NoWrite(_Blob):
        def upload_from_string(self, *_a: Any, **_k: Any) -> None:
            raise Forbidden("403")

    _fake(monkeypatch, _Bucket(_NoWrite()))
    with pytest.raises(StorageError, match="Storage Object Admin"):
        await storage.verify(_target(key_info))


# ---------------------------------------------------------------------------
# Copy from a signed URL: what relisting a capture into the catalogue is made of
# ---------------------------------------------------------------------------
class _Stream:
    """A streamed GET of the source, as httpx.stream() yields it."""

    def __init__(
        self,
        status: int = 200,
        chunks: tuple[bytes, ...] = (b"sourcehub ", b"capture"),
        content_type: str | None = "image/jpeg",
    ) -> None:
        self.status_code, self.chunks = status, chunks
        self.headers = {"content-type": content_type} if content_type else {}

    def __enter__(self) -> _Stream:
        return self

    def __exit__(self, *_: Any) -> None:
        return None

    def iter_bytes(self) -> Any:
        yield from self.chunks


def _source(monkeypatch: pytest.MonkeyPatch, stream: Any) -> dict[str, Any]:
    seen: dict[str, Any] = {}

    def fake(method: str, url: str, **kw: Any) -> Any:
        seen.update(method=method, url=url, **kw)
        if isinstance(stream, Exception):
            raise stream
        return stream

    monkeypatch.setattr(gcs_store.httpx, "stream", fake)
    return seen


async def test_copy_from_url_streams_the_source_into_the_bucket(monkeypatch, key_info):
    blob = _Blob()
    _fake(monkeypatch, _Bucket(blob))
    seen = _source(monkeypatch, _Stream())
    await gcs_store.copy_from_url(
        _target(key_info), "catalogue/d/1.jpg", "https://src.example/s?sig=1"
    )
    assert (seen["method"], seen["url"]) == ("GET", "https://src.example/s?sig=1")
    assert bytes(blob.written) == b"sourcehub capture"
    ((_, kw),) = [c for c in blob.calls if c[0] == "open"]
    assert kw["mode"] == "wb" and kw["content_type"] == "image/jpeg"
    # a copy may take minutes, and the SDK's own retries and waits stay off
    assert kw["retry"] is None and kw["timeout"][1] >= 600


async def test_a_source_with_no_type_is_stored_as_bytes(monkeypatch, key_info):
    blob = _Blob()
    _fake(monkeypatch, _Bucket(blob))
    _source(monkeypatch, _Stream(content_type=None))
    await gcs_store.copy_from_url(_target(key_info), "k", "https://src.example/s")
    assert blob.calls[0][1]["content_type"] == "application/octet-stream"


async def test_a_source_that_is_gone_is_lookuperror(monkeypatch, key_info):
    blob = _Blob()
    _fake(monkeypatch, _Bucket(blob))
    _source(monkeypatch, _Stream(status=404))
    with pytest.raises(LookupError):
        await gcs_store.copy_from_url(_target(key_info), "k", "https://src.example/s")
    assert blob.calls == []  # nothing opened, so nothing half-written


async def test_a_source_that_refuses_names_the_status_not_the_url(monkeypatch, key_info):
    _fake(monkeypatch, _Bucket(_Blob()))
    _source(monkeypatch, _Stream(status=403))
    with pytest.raises(StorageError) as e:
        await gcs_store.copy_from_url(_target(key_info), "k", "https://src.example/s?sig=secret")
    assert "403" in str(e.value) and "secret" not in str(e.value)


async def test_an_unreachable_source_is_a_storageerror(monkeypatch, key_info):
    _fake(monkeypatch, _Bucket(_Blob()))
    _source(monkeypatch, httpx.ConnectError("boom"))
    with pytest.raises(StorageError) as e:
        await gcs_store.copy_from_url(_target(key_info), "k", "https://src.example/s")
    assert "ConnectError" in str(e.value)


async def test_a_destination_the_account_cannot_write_is_named(monkeypatch, key_info):
    _fake(monkeypatch, _Bucket(_Blob(Forbidden("denied"))))
    _source(monkeypatch, _Stream())
    t = _target(key_info)
    with pytest.raises(StorageError) as e:
        await gcs_store.copy_from_url(t, "k", "https://src.example/s")
    assert t.bucket in str(e.value)


async def test_copy_between_hands_a_gcs_destination_the_signed_source(monkeypatch, key_info):
    calls: list[tuple[Any, ...]] = []

    async def presign(t: StorageTarget, key: str, filename: str, inline: bool = False) -> str:
        calls.append(("presign", t.bucket, key, filename))
        return "https://signed.example/get"

    async def copy_from_url(t: StorageTarget, dst: str, url: str) -> None:
        calls.append(("copy", t.bucket, dst, url))

    monkeypatch.setattr(storage, "presign_get", presign)
    monkeypatch.setattr(gcs_store, "copy_from_url", copy_from_url)
    src, dst = _target(key_info, bucket="client-bucket"), _target(None)
    await storage.copy_between(src, "a/b.jpg", dst, "catalogue/x/b.jpg", "b.jpg")
    assert calls == [
        ("presign", "client-bucket", "a/b.jpg", "b.jpg"),
        ("copy", "dm360-dev-files", "catalogue/x/b.jpg", "https://signed.example/get"),
    ]


async def test_copy_between_refuses_a_destination_that_cannot_fetch(key_info):
    s3 = StorageTarget(provider="s3", bucket="b", secret={})
    with pytest.raises(StorageError):
        await storage.copy_between(_target(key_info), "k", s3, "k", "f")
