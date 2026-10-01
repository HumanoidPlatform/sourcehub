"""The web image finds the API anywhere, and on the VM exactly as before.

frontend/nginx.conf is a template since staging moved to Azure Container Apps:
frontend/docker/40-sourcehub-config.sh fills it in at every start from four
environment variables. The risks this file guards:

  * a default drifting away from the VM's compose network, which would break
    the dev platform the next time its web image is rebuilt, with nothing in
    the image build to notice;
  * a placeholder the script does not fill, which nginx would reject at start
    (or, worse, accept as a literal host name);
  * the script not being wired into the image, or wired somewhere nginx's
    entrypoint never looks, or where the stock envsubst step would rewrite
    every $variable in it;
  * the forged-address fix (X-Forwarded-For $remote_addr) quietly reverting.

Files are read, never executed: the rendered config is checked in Python
against the same substitutions the script makes. The script itself was run in
the real image for the VM defaults, the staging values and bad input.

    pytest tests/test_web_image_unit.py
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE = ROOT / "frontend" / "nginx.conf"
SCRIPT = ROOT / "frontend" / "docker" / "40-sourcehub-config.sh"
DOCKERFILE = ROOT / "frontend" / "Dockerfile"
API_DOCKERFILE = ROOT / "backend" / "Dockerfile"
COMPOSE = ROOT / "infra" / "deploy" / "docker-compose.yml"

TPL = TEMPLATE.read_text(encoding="utf-8").replace("\r\n", "\n")
SH = SCRIPT.read_text(encoding="utf-8").replace("\r\n", "\n")
DF = DOCKERFILE.read_text(encoding="utf-8").replace("\r\n", "\n")


def _code(text: str) -> str:
    """Comments out: an assertion about a directive must not match prose."""
    return "\n".join(re.sub(r"#.*$", "", line) for line in text.splitlines())


def _default(name: str) -> str:
    m = re.search(rf'^{name}="\$\{{{name}:-(.*?)\}}"$', SH, re.M)
    assert m, f"{name} has no default in {SCRIPT.name}"
    return m.group(1).replace("\\$", "$")


def _render(upstream: str, host: str, resolver: str) -> str:
    """What the script's sed writes to /etc/nginx/conf.d/default.conf."""
    return (
        TPL.replace("__API_UPSTREAM__", upstream)
        .replace("__API_HOST_HEADER__", host)
        .replace("__API_RESOLVER__", resolver)
    )


# ---------------------------------------------------------------------------
# The placeholders and the script agree
# ---------------------------------------------------------------------------


def test_every_placeholder_is_filled_by_the_script():
    placeholders = set(re.findall(r"__API_[A-Z_]+__", _code(TPL)))
    filled = set(re.findall(r'-e "s\|(__API_[A-Z_]+__)\|', SH))
    assert placeholders == {"__API_UPSTREAM__", "__API_HOST_HEADER__", "__API_RESOLVER__"}
    assert placeholders == filled


def test_the_template_hard_codes_nothing_the_script_owns():
    code = _code(TPL)
    assert "127.0.0.11" not in code
    assert "api:8000" not in code
    assert "set_real_ip_from" not in code
    assert "include /etc/nginx/sourcehub/real-ip.conf;" in code


# ---------------------------------------------------------------------------
# The defaults are the VM
# ---------------------------------------------------------------------------


def test_the_defaults_are_the_vms_compose_network():
    assert _default("API_UPSTREAM") == "http://api:8000"
    assert _default("API_HOST_HEADER") == "$host"
    assert _default("REAL_IP_FROM") == "172.16.0.0/12 192.168.0.0/16"
    # the resolver is read from the container, not assumed
    assert "awk '$1 == \"nameserver\" { print $2; exit }' /etc/resolv.conf" in SH


def test_the_vm_still_names_its_api_api_on_port_8000():
    compose = COMPOSE.read_text(encoding="utf-8")
    assert re.search(r"^  api:\n", compose, re.M), "the compose service is no longer called api"
    assert "EXPOSE 8000" in API_DOCKERFILE.read_text(encoding="utf-8")
    assert '"--port", "8000"' in API_DOCKERFILE.read_text(encoding="utf-8")


def test_rendered_with_the_defaults_it_is_the_vm_config():
    vm = _code(_render(_default("API_UPSTREAM"), _default("API_HOST_HEADER"), "127.0.0.11"))
    assert vm.count("resolver 127.0.0.11 valid=10s ipv6=off;") == 2  # /api/ and /health
    assert "set $api_upstream http://api:8000;" in vm
    assert "set $api_health http://api:8000;" in vm
    assert re.search(r"proxy_set_header Host\s+\$host;", vm)
    assert "__API_" not in vm


def test_the_forged_address_fix_is_still_in_place():
    # nginx asserts the peer; the append form would let a caller choose the
    # address written into login_attempt (see the comment in nginx.conf).
    code = _code(TPL)
    assert re.search(r"proxy_set_header X-Forwarded-For\s+\$remote_addr;", code)
    assert "$proxy_add_x_forwarded_for" not in code
    assert "real_ip_header   X-Forwarded-For;" in code


STAGING_API = "datamind360-staging-api.internal.example-1234.centralindia.azurecontainerapps.io"


def test_rendered_with_the_staging_values_it_reaches_the_api_app():
    staging = _code(_render(f"http://{STAGING_API}", STAGING_API, "100.100.224.10"))
    assert f"set $api_upstream http://{STAGING_API};" in staging
    assert re.search(rf"proxy_set_header Host\s+{re.escape(STAGING_API)};", staging)
    # the browser's host still reaches the API
    assert re.search(r"proxy_set_header X-Forwarded-Host\s+\$host;", staging)


def test_the_runbook_gives_fully_qualified_api_addresses():
    # nginx's resolver ignores resolv.conf search domains: outside Docker a
    # short upstream name may not resolve for nginx even where curl finds it.
    runbook = (ROOT / "infra" / "deploy" / "STAGING.md").read_text(encoding="utf-8")
    assert "http://api:8000" in runbook  # the VM default, which Docker resolves itself
    upstreams = [u for u in re.findall(r"`(http://[^`]+)`", runbook) if u != "http://api:8000"]
    assert any(".internal." in u for u in upstreams), "no Container Apps address in the runbook"
    assert any(".svc.cluster.local" in u for u in upstreams), "no Kubernetes address in the runbook"
    for u in upstreams:
        host = u.removeprefix("http://").split(":")[0].split("/")[0]
        assert "." in host, f"{u} is a short name; nginx needs the fully qualified one"


# ---------------------------------------------------------------------------
# The script fails loudly rather than serving a broken proxy
# ---------------------------------------------------------------------------


def test_the_script_stops_on_errors_and_on_bad_values():
    assert "set -eu" in SH
    guard = re.search(r'case "\$\{pair#\*=\}" in\n\s+(.*?)\)', SH)
    assert guard, "the value check is gone"
    for ch in (";", "|", "&", "{", "}", "space"):
        assert (ch == "space" and "[:space:]" in guard.group(1)) or ch in guard.group(1), ch
    assert re.search(r"\*\[!0-9a-fA-F\.:/\]\*\) echo .*REAL_IP_FROM", SH), (
        "REAL_IP_FROM is no longer checked"
    )
    assert 'grep -q "__API_" "$OUT"' in SH, "a left-over placeholder is no longer caught"


def test_the_script_writes_what_nginx_reads():
    assert "OUT=/etc/nginx/conf.d/default.conf" in SH
    assert "TEMPLATE=/etc/nginx/sourcehub/default.conf.template" in SH
    assert "REAL_IP=/etc/nginx/sourcehub/real-ip.conf" in SH


# ---------------------------------------------------------------------------
# The image runs it
# ---------------------------------------------------------------------------


def test_the_dockerfile_wires_the_template_and_the_script():
    prod = DF.split("AS prod", 1)[1]
    assert "COPY nginx.conf /etc/nginx/sourcehub/default.conf.template" in prod
    m = re.search(r"COPY docker/40-sourcehub-config\.sh (/docker-entrypoint\.d/\S+)", prod)
    assert m, "the script is not copied into nginx's entrypoint directory"
    assert m.group(1).endswith(".sh"), "nginx's entrypoint only runs *.sh files"
    assert "chmod 0755 /docker-entrypoint.d/40-sourcehub-config.sh" in prod, (
        "it only runs executable ones"
    )
    assert "sed -i 's/\\r$//'" in prod, (
        "a Windows checkout would leave carriage returns in the script"
    )
    # the stock 20-envsubst step rewrites every $variable in /etc/nginx/templates
    assert "/etc/nginx/templates" not in _code(prod)
    # nginx's entrypoint runs /docker-entrypoint.d only when the command is nginx
    assert 'CMD ["nginx", "-g", "daemon off;"]' in prod
