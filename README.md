# OH! 薅乐马

基于 Vite、TypeScript 和 PixiJS 的像素网吧小游戏。画面中的工位、屏幕、马和
牛老板使用分层图片资产；排行榜通过独立 Node 适配器读取近 7 日 Token 消耗。

## 本地运行

```bash
npm ci
npm run dev
```

打开 <http://127.0.0.1:5173/>。页面显示真实近 7 日榜单并每 30 秒刷新；上游不可用时显示明确的不可用状态，不使用演示排名。

本地接 mock 或真实适配器时，可用运行时配置或 URL 参数：

```text
http://127.0.0.1:5173/?api=http://127.0.0.1:8788
```

## 真实数据架构

```text
NewAPI / Sub2API
        |
        v
server/index.mjs  (服务端凭据、缓存、脱敏、按 Token 排序)
        |
        v
GET /api/ranking?period=week
        |
        v
左侧近 7 日榜单 + PixiJS 游戏
```

适配器支持两种数据源：

- `USAGE_SOURCE=newapi`：读取 YHOO NewAPI 的 `/api/data/users`。
- `USAGE_SOURCE=sub2api`：读取 Sub2API 管理员 dashboard ranking/trend，并在
  服务端按 `tokens` 排序，而不是沿用默认费用排序。

上游 Token 只允许出现在服务端环境变量中。浏览器只收到脱敏用户名和聚合后的
公开榜单数据。

## 测试与构建

```bash
npm run test:api
npm run build
```

部署拆分、环境变量、Nginx 和回滚说明见
[`deploy/README.md`](./deploy/README.md)。
