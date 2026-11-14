FROM nginx:1.27-alpine AS web
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh

FROM node:22-alpine AS api
WORKDIR /app
COPY server ./server
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8788
USER node
CMD ["node", "server/index.mjs"]
