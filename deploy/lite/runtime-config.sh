#!/bin/sh
set -eu
case "$USAGE_SOURCE" in sub2api|newapi) ;; *) echo 'USAGE_SOURCE must be sub2api or newapi' >&2; exit 1;; esac
printf 'window.OH_HAOLEMA_RUNTIME={apiBase:"",rankingPath:"/api/ranking",pollMs:30000,source:"%s"};\n' "$USAGE_SOURCE" > /usr/share/nginx/html/runtime-config.js
