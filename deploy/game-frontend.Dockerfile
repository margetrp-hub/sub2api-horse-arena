FROM node:22-alpine AS build

WORKDIR /app
ARG GAME_BASE_PATH=/
ARG GAME_SOURCE=newapi
ARG GAME_RANKING_PATH=/api/ranking
ENV GAME_BASE_PATH=${GAME_BASE_PATH}
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN node -e 'const fs = require("node:fs"); const config = { apiBase: "", rankingPath: process.env.GAME_RANKING_PATH, pollMs: 30000, source: process.env.GAME_SOURCE }; fs.writeFileSync("dist/runtime-config.js", "window.OH_HAOLEMA_RUNTIME = Object.assign(" + JSON.stringify(config) + ", window.OH_HAOLEMA_RUNTIME || {});\n");'

FROM nginx:1.27-alpine
ARG SOURCE_REVISION
LABEL org.opencontainers.image.source="https://github.com/margetrp-hub/sub2api-horse-arena" \
    org.opencontainers.image.revision="${SOURCE_REVISION}"

COPY --from=build /app/dist/ /usr/share/nginx/html/
COPY deploy/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# The static server only needs an unprivileged listener. Preparing the
# writable runtime directories here lets the container stay read-only at run
# time without relying on the image entrypoint to chown them.
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp /var/run \
    && chown -R nginx:nginx /var/cache/nginx /var/run /var/log/nginx

USER nginx
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]

EXPOSE 8080
