# 自动轻量发布

`publish-lite.yml` 在本仓库正式 Release 发布后检出同一 tag，运行玩法、API、授权与上传恢复回归，生成 `oh-haolema-lite-<tag>.tar.gz`。同一源码维护，没有第二仓库或轻量分支；日常 push 不等同发版。

包内是预构建前端、必要 Node API、Compose 和接入说明。未跟踪美术与私有环境文件不进入包。`oh-haolema-lite.sha256` 校验压缩包，`oh-haolema-lite.json` 记录同一 source SHA 和每个文件的摘要，作为最后上传的完成回执。

失败后由发布者查看 Actions 并重跑，或手动运行 **Publish matching lite edition** 输入已有发布 tag 补发。留空只构建短期验证附件，不创建版本。网络中断后的重跑先读回已有附件；相同文件跳过，不同文件报错并保留，修正用新版本。不得改 tag 或覆盖已发布文件。

当前 `publish-web.yml` 仍是显式的镜像发布入口，不创建 Release。若以后在工作流里用 `GITHUB_TOKEN` 创建完整 Release，必须在成功后直接 `uses: ./.github/workflows/publish-lite.yml` 并传 `release_tag`，不能等待另一个 release 事件。依据 [GitHub 的事件规则](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow#triggering-a-workflow-from-a-workflow)，该 Token 创建的 release 不会再次触发工作流。

本地预览：`node scripts/package-lite.mjs`。脏源码产物有 `dirty` 标记，不能正式上传。Sub 的内嵌游戏继续固定审核过的源码提交和原生排行/积分；这里发布新版不会自动改它的 pin 或上线生产。
