#!/usr/bin/env bash
set -euo pipefail

API_BASE="https://api.cloudflare.com/client/v4"
ENV_FILE="${1:-infra/k8s/envs/production.env}"

required_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "Missing required environment variable: ${name}" >&2
    exit 1
  fi
}

# GitHub secrets frequently carry a trailing newline or stray spaces. Those end up
# inside the request URL, where Cloudflare cannot route the path and answers with
# HTTP 400 / code 7003 instead of a useful message, so strip them up front.
trim_ws() { printf '%s' "${1//[[:space:]]/}"; }

# Account, zone and tunnel identifiers are 32-hex (or dashed UUID) strings. Validating
# the shape here turns "wrong secret pasted" into an actionable error rather than an
# opaque 400 from the API.
require_identifier() {
  local name="$1" value="${!1}"
  if ! [[ "$value" =~ ^[0-9a-fA-F]{32}$ || "$value" =~ ^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$ ]]; then
    echo "${name} does not look like a Cloudflare identifier (expected 32 hex chars or a UUID)." >&2
    echo "Got a ${#value}-character value. Check that the secret holds the ID and not a token." >&2
    exit 1
  fi
}

env_value() {
  local key="$1"
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); sub(/\r$/, ""); print; exit }' "$ENV_FILE"
}

cf_request() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local response http_code
  response="$(mktemp)"

  local -a curl_args=(
    --silent --show-error --retry 3
    --output "$response" --write-out '%{http_code}'
    --request "$method" "$url"
    --header "Authorization: Bearer ${CLOUDFLARE_TUNNEL_API_TOKEN}"
    --header "Content-Type: application/json"
  )
  if [ -n "$body" ]; then
    curl_args+=(--data "$body")
  fi

  if ! http_code="$(curl "${curl_args[@]}")"; then
    echo "Cloudflare request could not be completed: ${method} ${url#"$API_BASE"}" >&2
    rm -f "$response"
    return 1
  fi

  # Surface what Cloudflare actually said. The previous version let --fail-with-body
  # abort the function under `set -e`, so the response body was discarded and the only
  # evidence left in the deploy log was "curl: (22) ... error: 400".
  if [ "$http_code" != "200" ] || [ "$(jq -r '.success // false' "$response" 2>/dev/null)" != "true" ]; then
    {
      echo "Cloudflare API error: ${method} ${url#"$API_BASE"} -> HTTP ${http_code}"
      jq -r '(.errors // [])[] | "  - code \(.code): \(.message)"' "$response" 2>/dev/null \
        || sed 's/^/  /' "$response"
    } >&2
    rm -f "$response"
    return 1
  fi
  cat "$response"
  rm -f "$response"
}

reconcile_cname() {
  local hostname="$1"
  local target="${CLOUDFLARE_TUNNEL_ID}.cfargotunnel.com"
  local encoded_hostname record_id body record
  encoded_hostname="$(jq -rn --arg value "$hostname" '$value | @uri')"
  record_id="$(cf_request GET "${API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=CNAME&name=${encoded_hostname}" | jq -r '.result[0].id // empty')"
  body="$(jq -cn --arg name "$hostname" --arg content "$target" \
    '{type:"CNAME", name:$name, content:$content, proxied:true, ttl:1, comment:"Managed by causas production deploy"}')"
  if [ -n "$record_id" ]; then
    cf_request PATCH "${API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record_id}" "$body" >/dev/null
    echo "Updated DNS route: ${hostname} -> ${target}"
  else
    record="$(cf_request POST "${API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/dns_records" "$body")"
    record_id="$(jq -r '.result.id // empty' <<<"$record")"
    echo "Created DNS route: ${hostname} -> ${target}"
  fi

  # A Tunnel hostname must be proxied. A gray-cloud CNAME resolves to the
  # tunnel's private target and is unreachable from the public Internet.
  record="$(cf_request GET "${API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${record_id}")"
  if [ "$(jq -r '.result.proxied // false' <<<"$record")" != "true" ]; then
    echo "Cloudflare left ${hostname} DNS-only; it must be proxied for the Tunnel to be public." >&2
    exit 1
  fi
  echo "Verified proxied DNS route: ${hostname}"
}

required_env CLOUDFLARE_TUNNEL_API_TOKEN
required_env CLOUDFLARE_ACCOUNT_ID
required_env CLOUDFLARE_ZONE_ID
required_env CLOUDFLARE_TUNNEL_ID
command -v curl >/dev/null
command -v jq >/dev/null
test -f "$ENV_FILE"

CLOUDFLARE_TUNNEL_API_TOKEN="$(trim_ws "$CLOUDFLARE_TUNNEL_API_TOKEN")"
CLOUDFLARE_ACCOUNT_ID="$(trim_ws "$CLOUDFLARE_ACCOUNT_ID")"
CLOUDFLARE_ZONE_ID="$(trim_ws "$CLOUDFLARE_ZONE_ID")"
CLOUDFLARE_TUNNEL_ID="$(trim_ws "$CLOUDFLARE_TUNNEL_ID")"
require_identifier CLOUDFLARE_ACCOUNT_ID
require_identifier CLOUDFLARE_ZONE_ID
require_identifier CLOUDFLARE_TUNNEL_ID

ADMIN_HOSTNAME="$(env_value CLOUDFLARE_ADMIN_HOSTNAME)"
required_env ADMIN_HOSTNAME

# Preflight: confirm the token can see the tunnel and that the tunnel accepts remote
# configuration at all. A locally-managed tunnel rejects PUT /configurations with a
# bare 400, which is indistinguishable from a malformed body without this check.
TUNNEL="$(cf_request GET "${API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${CLOUDFLARE_TUNNEL_ID}")"
TUNNEL_NAME="$(jq -r '.result.name // "unknown"' <<<"$TUNNEL")"
CONFIG_SRC="$(jq -r '.result.config_src // "unknown"' <<<"$TUNNEL")"
echo "Tunnel ${TUNNEL_NAME} (${CLOUDFLARE_TUNNEL_ID}) config_src=${CONFIG_SRC}"
if [ "$CONFIG_SRC" != "cloudflare" ]; then
  echo "Tunnel is ${CONFIG_SRC}-managed. The configurations API only accepts remotely-managed" >&2
  echo "tunnels; migrate it in the Zero Trust dashboard or manage ingress via cloudflared config." >&2
  exit 1
fi

# Only apps/admin is public — apps/api is called server-side over the
# in-cluster Service DNS (see apps/admin/src/lib/api-client.ts), so there's
# no separate api/apex hostname to route.
CONFIG="$(jq -cn \
  --arg admin "$ADMIN_HOSTNAME" \
  '{config:{ingress:[
    {hostname:$admin,service:"http://admin.causas.svc.cluster.local:3001"},
    {service:"http_status:404"}
  ]}}')"

cf_request PUT \
  "${API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${CLOUDFLARE_TUNNEL_ID}/configurations" \
  "$CONFIG" >/dev/null
echo "Updated Cloudflare Tunnel ingress configuration."

reconcile_cname "$ADMIN_HOSTNAME"

CONNECTIONS="$(cf_request GET "${API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/cfd_tunnel/${CLOUDFLARE_TUNNEL_ID}/connections")"
CONNECTION_COUNT="$(jq '.result | length' <<<"$CONNECTIONS")"
echo "Cloudflare currently reports ${CONNECTION_COUNT} active edge connection record(s)."
if [ "$CONNECTION_COUNT" -lt 1 ]; then
  echo "Cloudflare Tunnel has no active edge connections." >&2
  exit 1
fi
