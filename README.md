# OH! 薅乐马

基于 Vite、TypeScript 和 PixiJS 的像素网吧小游戏。画面中的工位、屏幕、马和
牛老板使用分层图片资产；排行榜通过独立 Node 适配器读取近 7 日 Token 消耗。
幸运扭蛋机使用 Three.js 和 cannon-es，支持触摸/鼠标旋转、旋钮试玩、胶囊碰撞与出仓动画。

## 本地运行

```bash
npm ci
npm run dev
```

打开 <http://127.0.0.1:5173/>。配置可用的排名适配器后，页面显示真实近 7 日榜单并每 30 秒刷新；上游不可用时显示明确的不可用状态，不使用演示排名。个人工位可独立试玩，不要求先启动适配器。

本地接 mock 或真实适配器时，可用运行时配置或 URL 参数：

```text
http://127.0.0.1:5173/?api=http://127.0.0.1:8788
```

## 个人工位与本地练习

### 微缩 3D 工位小样（2026-10-08）

开发服务器打开 `/diorama.html`，构建预览打开 `/game/diorama.html`。这是独立的本地设计候选：暖色微缩网吧、玩具小马、CRT 工位和牛老板查岗，固定镜头；可直接预览上班、摸鱼、查岗动作，也可进行一分钟挑战。

挑战复用 `src/practice/rules.ts`，支持按住 / 空格与点按切换；松手上班一秒保分，查岗被抓只丢暂存分，离开页面中止。音效默认关闭，可减少动态效果。小样不请求账号或榜单接口，不保存成长、不发放奖励；像素入口保持独立。美术与验收证据见 [`design-qa.md`](./design-qa.md)。

Blender 材质与灯光试样使用同一场景导出的 GLB，保留小马、牛老板、4:3 游戏屏幕及中文招牌。运行下面的工具生成可编辑 `.blend` 和 Cycles 静帧；模型姿势为上班 / 查岗，尚未生成骨骼动画。工具不进入网页构建。

```powershell
node tools/blender/export-workstation.mjs
blender --background --factory-startup --python scripts/render_blender_diorama.py -- --source output/blender/haolema-20261008/workstation-source.glb --output output/blender/haolema-20261008 --samples 64 --width 1600 --detail
```

导出条件和节点名称见 [`tools/blender/README.md`](./tools/blender/README.md)。本地输出在 `output/blender/haolema-20261008/`，资源打包在 `.blend` 内；输出文件不提交到源码仓库。

2026-09-07 UI 已更新：个人工位、对局计分、下班小票与幸运扭蛋机统一视觉；主入口右侧保留完整 TOP 10，支持键盘选人、断线重试与手机滚动。设计与浏览器证据见 [`design-qa.md`](./design-qa.md)。

`index.html` 和 `game.html` 共用同一套个人工位、挑战规则和结算界面。未上榜或未登录也能开局，公共 TOP 10 保留原有真实用量口径。

- 点击“摸鱼一局”，3 秒准备后进行 60 秒挑战。
- 按住按钮或空格摸鱼，松开立即上班；连续上班 1 秒把暂存分保住。也可在开局前选择“切换”操作模式。
- 连续摸鱼提高倍率；老板预警后会查岗，被抓只丢暂存分，恢复 2 秒后可继续。
- 到点只结算保住分。下班小票可重开或回工位；退出、失焦或页面隐藏会中止当前局，不计有效完成。
- 音效默认关闭。成绩、完成次数和设置只在当前页面会话内保留，刷新后清空。

这是 Phase A 试玩功能，不保存账号成长、不解锁收藏、不发放账户奖励，也不改变 Token 排名、签到积分、抽奖机会或余额。扭蛋页的账户积分来自服务端，未登录或无法连接时显示未知；抽奖与兑换的开放状态以服务端为准。

扭蛋机的旋钮与试玩按钮只播放机器动画，不调用抽奖或兑换接口。正式抽奖按钮仍需服务端授权；响应成功后才播放出仓和展示结果。账户刷新保留同一个 WebGL 场景；页面不可见时暂停渲染，减少动态效果设置会跳过长动画，不支持 WebGL 时显示现有图片并保留账户操作。

本地验证记录与未验收项见 [`tests/practice-qa.md`](./tests/practice-qa.md)。构建默认使用 `/game/` 路径；检查构建产物可运行 `npm run preview -- --base /game/`，入口分别为 `/game/` 和 `/game/game.html`。

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

`Publish game frontend` 工作流按当前 `main` 提交手动发布独立 GHCR 前端镜像，输出不可变 digest 和静态文件校验包；工作流不自动部署服务器。镜像默认连接 Sub2API 的 `/game-api/ranking`，NewAPI 静态部署须保留该站现有 `runtime-config.js`。

```bash
npm run test:practice
npm run test:api
npm run build
```

部署拆分、环境变量、Nginx 和回滚说明见
[`deploy/README.md`](./deploy/README.md)。
