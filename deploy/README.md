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
SUB2API_BASE_URL=https://sub2api.example.com
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
回滚游戏服务不回滚已入账的积分流水。

## 正式积分

积分桥是可选扩展，不是运行小游戏或排行榜的前置条件。现有实现使用 ErDai Core 的 `/points-bridge/v1/site/*` 协议，不是 New API / Sub2API 的通用余额接口；未配置时账户积分不可用，本地练习仍可运行。

使用该扩展时，配置独立的 `ERDAI_POINTS_SITE_TOKEN`、`ERDAI_POINTS_BASE_URL` 和精确的 `CORS_ORIGINS`；Core 对应凭据必须绑定本站 transport 和 HTTPS origin。仅代理 `/api/points/account`、`/api/points/checkin` 到游戏适配器，不覆盖主站其他 API。保持 `LOTTERY_PREVIEW_ENABLED=0`。

游戏后端通过主站的真实 `/api/user/self`（NewAPI）或 `/api/v1/auth/me`（Sub2API）验证当前用户，然后读取积分。新版 NewAPI 页面通过其既有 refresh cookie 流程取得内存令牌；令牌不写入本地存储。首次主动开通零余额账户，签到使用 Core 的北京时间日界和奖励配置，流水支持分页。浏览器不能指定用户、余额或奖励值。原本机演示积分不进入真实账本；经管理员核验关联的身份共用余额和每日签到资格。

奖池、兑换比例和发奖流程尚未确定，抽奖及兑换保持关闭。上线验收需覆盖登录、开通、重复签到、余额刷新、分页、退出登录和服务失败，不以演示账户响应代替生产验证。

## 登录返回与关联说明

游戏登录链接仅携带当前游戏页路径，点击时在本标签页保存 15 分钟的返回意图，不携带令牌或任意 URL 参数。主站登录外壳需加载 `public/auth-return.js`：NewAPI 的 HTML `location /` 引入 `nginx-newapi-auth-return.conf`；Sub2API 游戏域名的 server 引入 `nginx-sub2api-auth-return.conf`，不要加到其他业务域名。已有相同 Nginx 指令时合并配置，避免重复。

脚本仅在明确从游戏去登录时运行，将主站单页路由的游戏目标重新加载为独立页面。二次验证或第三方登录落到 dashboard 时，先验证现有站点登录态再返回；失败、取消、过期或外部地址不会跳转。不修改主站登录、条款与验证码逻辑。部署时校验主站 HTML 中实际出现脚本、脚本可访问，并完成真实登录回跳验收。

积分规则和账户关联使用共用面板。账户编号与核验说明可复制给主站管理员；复制不会提交申请或自动合并。管理员继续在 Core 积分后台核验、关联或合并身份。浏览器不获取管理凭据，不声称关联已经完成。

NewAPI 积分和排行榜轮询共用内存会话，在令牌到期前一分钟或最多五分钟后重新确认；匿名状态也短时复用，避免每次轮询都调用主站 refresh 并触发登录频率限制。接收主站既有账户切换/退出广播与 storage 事件后立即失效，过期请求不能恢复旧账户；429 遵守 Retry-After。缓存不写入持久存储，积分 API 仍逐次验证真实用户。
