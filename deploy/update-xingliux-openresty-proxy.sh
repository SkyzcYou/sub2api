#!/usr/bin/env bash

set -Eeuo pipefail

TARGET_CONFIG="/opt/1panel/www/sites/x.xingliu.live/proxy/root.conf"
OPENRESTY_CONTAINER="${OPENRESTY_CONTAINER:-1Panel-openresty-1sYd}"
OPENRESTY_BIN="/usr/local/openresty/bin/openresty"

if [[ "${#}" -ne 0 ]]; then
    printf 'Usage: %s\n' "$0" >&2
    exit 2
fi

if [[ "${EUID}" -eq 0 ]]; then
    SUDO=()
else
    SUDO=(sudo)
    "${SUDO[@]}" -v
fi

if ! command -v docker >/dev/null 2>&1; then
    printf 'docker is required on the host.\n' >&2
    exit 1
fi

if ! "${SUDO[@]}" test -f "${TARGET_CONFIG}"; then
    printf 'Target config does not exist: %s\n' "${TARGET_CONFIG}" >&2
    exit 1
fi

container_running="$("${SUDO[@]}" docker inspect --format '{{.State.Running}}' "${OPENRESTY_CONTAINER}" 2>/dev/null || true)"
if [[ "${container_running}" != "true" ]]; then
    printf 'OpenResty container is not running: %s\n' "${OPENRESTY_CONTAINER}" >&2
    exit 1
fi

tmp_config="$(mktemp)"
backup_config="${TARGET_CONFIG}.bak.$(date -u +%Y%m%d%H%M%S)"

cleanup() {
    rm -f "${tmp_config}"
}
trap cleanup EXIT

cat >"${tmp_config}" <<'NGINX'
location ^~ / {
    # Intentionally reflect every Origin to allow cross-origin browser clients.
    # Do not use this policy with cookie-authenticated administrative endpoints.
    set $cors_origin $http_origin;

    # Upgrade only requests that actually ask for a WebSocket upgrade.
    set $connection_upgrade "";
    if ($http_upgrade != "") {
        set $connection_upgrade "upgrade";
    }

    if ($request_method = OPTIONS) {
        add_header Access-Control-Allow-Origin $cors_origin always;
        add_header Access-Control-Allow-Credentials "true" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin,X-API-Key,api-key,anthropic-version,OpenAI-Organization,OpenAI-Project,X-Title,HTTP-Referer" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS" always;
        add_header Access-Control-Max-Age 1728000 always;
        add_header Content-Type "text/plain; charset=utf-8" always;
        add_header Content-Length 0 always;
        return 204;
    }

    client_max_body_size 256m;

    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;

    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Port $server_port;
    proxy_set_header REMOTE-HOST $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    # Long-running model requests and SSE streams.
    proxy_connect_timeout 900s;
    proxy_send_timeout 900s;
    proxy_read_timeout 900s;
    send_timeout 900s;

    # Do not buffer or cache request/response streams.
    proxy_buffering off;
    proxy_request_buffering off;
    proxy_cache off;
    gzip off;

    proxy_hide_header Access-Control-Allow-Origin;
    proxy_hide_header Access-Control-Allow-Credentials;
    proxy_hide_header Access-Control-Allow-Headers;
    proxy_hide_header Access-Control-Allow-Methods;
    proxy_hide_header Access-Control-Expose-Headers;
    proxy_hide_header Access-Control-Max-Age;

    add_header X-Accel-Buffering no always;
    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Credentials "true" always;
    add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization,Accept,Origin,X-API-Key,api-key,anthropic-version,OpenAI-Organization,OpenAI-Project,X-Title,HTTP-Referer" always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS" always;
    add_header Access-Control-Expose-Headers "Content-Length,Content-Range,X-Oneapi-Request-Id,X-Rixapi-Request-Id,X-Reasoning-Included,X-Codex-Turn-State" always;
    add_header Access-Control-Max-Age 1728000 always;
    add_header Vary Origin always;
    add_header X-Cache $upstream_cache_status;
    add_header Strict-Transport-Security "max-age=31536000" always;
}
NGINX

"${SUDO[@]}" cp -a "${TARGET_CONFIG}" "${backup_config}"
"${SUDO[@]}" install -o root -g root -m 0644 "${tmp_config}" "${TARGET_CONFIG}"

if ! "${SUDO[@]}" docker exec "${OPENRESTY_CONTAINER}" "${OPENRESTY_BIN}" -t; then
    printf 'OpenResty validation failed; restoring %s\n' "${backup_config}" >&2
    "${SUDO[@]}" cp -a "${backup_config}" "${TARGET_CONFIG}"
    exit 1
fi

if ! "${SUDO[@]}" docker exec "${OPENRESTY_CONTAINER}" "${OPENRESTY_BIN}" -s reload; then
    printf 'OpenResty reload failed; restoring %s\n' "${backup_config}" >&2
    "${SUDO[@]}" cp -a "${backup_config}" "${TARGET_CONFIG}"
    exit 1
fi

printf 'OpenResty proxy updated and reloaded.\n'
printf 'CORS policy: reflect every request Origin.\n'
printf 'Backup: %s\n' "${backup_config}"
