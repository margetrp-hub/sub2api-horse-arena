# 素材与依赖

项目源码和本仓库提供的项目素材按根目录 MIT 许可证提供。`OH! 薅乐马` 是本项目名称；许可证不授予第三方商标权，也不表示与画面中所参考的游戏或产品存在合作关系。

## 项目素材

- `public/assets/` 是网页使用的图像、分层工位、人物动作帧和屏幕素材；`assets/` 保存相应制作过程与早期版本。
- 网吧、马、牛老板与 CRT 屏幕画面包含项目制作过程中生成的 AI 图像以及人工整理的裁切、遮罩和动作帧。屏幕源图在 `assets/station-prototype/raw/screen-real-*-v4.png`，发布图在 `public/assets/screen-real-v4/`；后处理工具为 `scripts/process_screen_content_assets.py`。
- 屏幕内容是游戏场景装饰，不代表真实下载、账户额度、视频播放或实盘状态。真实榜单与账户状态由独立服务返回。
- `tools/blender/` 和 `scripts/render_blender_diorama.py` 为项目 3D 试样工具；生成的本地 Blender 工程不随源码提交。

## 第三方依赖

第三方库保留各自许可证，不因本项目采用 MIT 而重新授权。准确版本由 `package-lock.json` 固定，许可证全文随对应 npm 包提供。

| 依赖 | 用途 | 许可证 |
| --- | --- | --- |
| PixiJS | 分层像素场景与动画 | MIT |
| Three.js | 扭蛋机和 3D 工位 | MIT |
| cannon-es | 扭蛋物理模拟 | MIT |
| Lucide | 界面图标 | ISC |
| Vite | 前端开发与构建 | MIT |
| TypeScript | 类型检查 | Apache-2.0 |

贡献新的外部素材时，应同时记录来源和允许的使用范围，不提交凭据、真实用户数据或没有分发授权的素材。
