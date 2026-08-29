# OH! 薅乐马部署

本项目拆成两个运行单元：

- `oh-haolema-web`：Vite 构建后的 PixiJS 静态游戏，监听本机 `8098`。
- `oh-haolema-api`：Node 排名适配器，监听本机 `8788`，只在服务端访问 NewAPI 或 Sub2API。

外层 Nginx 使用 `nginx-game.example.conf` 把两个服务合并到同一个游戏域名：
浏览器访问 `/api/ranking`，但不会看到任何上游管理员凭据。

## 数据源

`game-api.env` 中用 `USAGE_SOURCE` 选择数据源：

```text
USAGE_SOURCE=newapi
```

NewAPI 需要 `NEWAPI_ACCESS_TOKEN` 和数字形式的 `NEWAPI_USER_ID`。适配器请求
`GET /api/data/users`，并发送 `Authorization: Bearer ...` 与 `New-Api-User`。

Sub2API 使用管理员 API Key 或 JWT：

```text
USAGE_SOURCE=sub2api
SUB2API_BASE_URL=https://ohlaoo.com
SUB2API_ADMIN_API_KEY=...
```

适配器读取 `/api/v1/admin/dashboard/users-ranking` 和可选的
`/api/v1/admin/dashboard/users-trend`，在适配器内按 `tokens` 重新排序。
这是必要的，因为 Sub2API 原生 users-ranking 默认按实际费用排序。

## 部署

在目标主机上把仓库检出到固定目录，例如 `/opt/oh-haolema`。不要把真实的
`game-api.env`、`runtime-config.local.js` 或任何 Token 提交到仓库。

```bash
cp deploy/game-api.env.example deploy/game-api.env
chmod 600 deploy/game-api.env

docker compose -f deploy/docker-compose.game-api.yml up -d --build
docker compose -f deploy/docker-compose.game-frontend.yml up -d --build

curl -fsS http://127.0.0.1:8788/healthz
curl -fsS http://127.0.0.1:8098/healthz
nginx -t
systemctl reload nginx
```

外层 Nginx 的 `server_name`、证书路径和游戏域名需要按目标环境填写。推荐给
游戏使用独立子域名，不要把 `/api/*` 规则覆盖现有 Sub2API 的 `/api/v1/*`。

## 验收

本地单测和构建：

```bash
npm ci
npm run test:api
npm run build
```

服务验收：

```bash
curl -fsS https://game.example.com/healthz
curl -fsS https://game.example.com/api/ranking?period=week\&limit=10
```

响应中的 `users[*].name` 应为脱敏名称，且按 `tokens` 降序；前端右侧榜单显示
`近 7 日 · 实时`。页面载入后读取近 7 日榜单，并每 30 秒刷新一次；首次读取失败时
显示明确的不可用空态，不使用演示排名冒充真实数据。

## 回滚

先停止新服务，再恢复上一个静态发布目录和 Nginx 配置。适配器无数据库迁移，
上游数据不会被写入。
