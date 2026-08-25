# 上游合入与 Frok 开发记录

本文档记录定制分支 `xingliux` 从上游 `upstream/main` 同步功能的过程、结果和影响。文件名中的 `Frok` 按请求保留。

## 项目基线

- 定制分支：`xingliux`
- 上游远程：`upstream`
- 上游分支：`upstream/main`
- 上游仓库：`https://github.com/Wei-Shaw/sub2api.git`
- 定制仓库：`https://github.com/SkyzcYou/sub2api.git`
- 初始基线提交：`7e2e9ba05`（当前 `xingliux` 与 `upstream/main` 的共同提交）

初始基线仅用于说明分支关系，不算一次上游合入记录。后续每次实际合入都必须在本文档追加一条记录。

## 合入原则

1. 只从 `upstream/main` 合入，不直接从上游其他临时分支同步。
2. 合入前确认工作区干净，并记录 `xingliux` 和 `upstream/main` 的提交号。
3. 默认使用显式合并提交，保留一次同步边界：`git merge --no-ff upstream/main`。
4. 发生冲突时，优先保留定制需求，同时逐项核对上游变更，禁止未经说明地覆盖定制代码。
5. 合入后执行与改动范围匹配的测试、构建和镜像验证；测试失败或未执行必须写明原因。
6. 合入记录完成后再推送分支。记录中不得包含密码、访问令牌或其他敏感凭证。

## 标准合入流程

在仓库根目录执行：

```bash
git switch xingliux
git status --short
git fetch upstream main --prune

BASE_BEFORE=$(git rev-parse HEAD)
UPSTREAM_TARGET=$(git rev-parse upstream/main)
UPSTREAM_BASE=$(git merge-base "$BASE_BEFORE" "$UPSTREAM_TARGET")
UPSTREAM_DATE=$(git show -s --format=%cI upstream/main)

git merge --no-ff --no-edit upstream/main

BASE_AFTER=$(git rev-parse HEAD)
git show --stat --oneline --summary "$BASE_AFTER"
git log --oneline --first-parent "$BASE_BEFORE..$BASE_AFTER"
```

如果合入产生冲突：

```bash
git status
# 编辑并解决冲突后
git add <已解决的文件>
git commit
# 如果确认无法继续
git merge --abort
```

合入后按项目实际情况执行检查，例如：

```bash
git diff --check "$BASE_BEFORE" "$BASE_AFTER"
(cd backend && go test ./...)
docker build -t <registry>/<namespace>/xingliux:<tag> .
```

完成验证后，将 `BASE_BEFORE`、`UPSTREAM_BASE`、`UPSTREAM_TARGET`、`BASE_AFTER`、变更范围、冲突处理、测试结果和总结写入下方记录，并推送 `xingliux`。

## 合入记录

### 2026-08-25：同步 upstream/main 的 0.1.182 OAuth 429 调度修复

- 合入前定制分支提交：`3f00cb75f28d98d264a1f0818d22997d6308d3cb`
- 上游共同基线提交：`aa2c4e8d136b13553ac7bae3d76c25715333a554`
- 本次合入的上游目标提交：`832cf4df659acc0a0d45feccb2b7bf99ea606198`
- 上游提交范围：`aa2c4e8d136b13553ac7bae3d76c25715333a554..832cf4df659acc0a0d45feccb2b7bf99ea606198`
- 上游最新提交日期：`2026-08-25T20:41:41+08:00`
- 上游提交数量：`2`（其中非合并提交 `1`）
- 变更范围：`4` 个文件，新增 `118` 行，删除 `14` 行
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`b67361f5b1205e658dcad4c9f7d7ab1728310a5e`
- 关联上游 PR、Issue 或 Release：PR `#6208`；上游版本仍为 `0.1.182`
- 主要变更：
  - OpenAI OAuth 账号收到 429 时区分明确的 5 小时/7 天配额耗尽、带重置时间的配额信号和普通瞬时限流；配额耗尽会立即暂停账号至重置时间，不再继续消耗同账号重试窗口。
  - 普通瞬时 429 仍保留短窗口同账号重试；流式 HTTP 200 内的语义 429 不使用成功响应的配额头做分类，但继续透传 `Retry-After`、请求 ID 等故障转移信息。
- 数据库迁移：本次上游范围没有新增数据库迁移文件。
- 定制代码影响：
  - 本次仅修改后端 OpenAI OAuth 429 分类、运行时阻断和故障转移逻辑，未触及设置、前端、数据库迁移或部署文件。
  - `site_favicon` 独立设置、USDT/卡网充值入口、深色主题、OpenResty 脚本和部署文档均保留；定制专项测试通过。
  - `deploy/docker-compose.yml` 仍使用阿里云 ACR `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名仍为 `xingliux`。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check 3f00cb75f28d98d264a1f0818d22997d6308d3cb b67361f5b1205e658dcad4c9f7d7ab1728310a5e`：通过。
  - `go test -tags unit ./internal/service -run '^(TestOpenAI429FastPath_|TestOpenAIStream429|TestOpenAIHTTP429|TestOpenAI429RetryDelay|TestOpenAIRuntimeBlock_|TestOpenAIOAuth429_)' -count=1 -v`：`15` 个 OpenAI 429/运行时阻断专项测试全部通过。
  - Go `1.27.0` 下执行 `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
  - `pnpm exec vitest run src/components/layout/__tests__/AppSidebar.spec.ts src/views/user/__tests__/USDTRechargeView.spec.ts src/views/admin/__tests__/SettingsView.spec.ts`：`3` 个测试文件、`44` 个测试全部通过；首次运行捕获到一次 jsdom XHR 网络噪声但未导致失败，相关设置用例单独重跑通过且未复现。
  - `bash deploy/tests/docker-compose-gateway-env-test.sh`：通过。
- 镜像或部署验证：本次仅完成上游合入和代码验证，未重新执行 Docker build/push，也未更新生产服务。ACR `latest` 仍为基于提交 `a4eb01c62eff1bc71f232f4d7208470aff585da8` 发布的 `0.1.182`，manifest digest 为 `sha256:c46533f16a0c5340021352ba3e82415b985a53b395fe556566feb2b8f5d77e6d`，不包含本次 OAuth 429 后续修复。
- 合入总结：
  - 本次同步避免配额已耗尽的 OpenAI OAuth 账号继续原账号重试，从而更快切换到可用账号，同时保留瞬时限流的低成本重试行为。
  - 上游版本号和迁移集合均未变化；发布本次修复需要重新构建并推送镜像，部署后重点观察 OAuth 账号的 5h/7d 配额暂停时间和瞬时 429 故障转移。

### 2026-08-25：同步 upstream/main 至 0.1.182

- 合入前定制分支提交：`e530cea183d5d63f1317e5286616105eadb25792`
- 上游共同基线提交：`e2d9b823f63dc4e8f4014be3fd24a0a73e339867`
- 本次合入的上游目标提交：`aa2c4e8d136b13553ac7bae3d76c25715333a554`
- 上游提交范围：`e2d9b823f63dc4e8f4014be3fd24a0a73e339867..aa2c4e8d136b13553ac7bae3d76c25715333a554`
- 上游最新提交日期：`2026-08-25T04:47:52Z`
- 上游提交数量：`22`（其中非合并提交 `14`）
- 变更范围：`48` 个文件，新增 `872` 行，删除 `154` 行
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`e6ca09498d85c88ea97238ab3979aaabccca1cf5`
- 关联上游 PR、Issue 或 Release：PR `#6157`、`#6155`、`#6152`、`#6149`、`#6132`、`#6116` 等；上游版本更新为 `0.1.182`
- 主要变更：
  - OpenAI Responses Lite、WebSocket/HTTP bridge 和透传链路统一强化工具调用模式，固定并校验 `parallel_tool_calls`，保留数值精度，并覆盖 OAuth/API Key、WS 和桥接请求路径。
  - OpenAI OAuth 图片生成保留用户提示词原文；补充 Responses Lite 工具规范化和图片请求回归测试。
  - 修复 Anthropic cache TTL 流式计费重复累计，规范 5m/1h cache creation 明细与聚合总量之间的矛盾。
  - OpenCode Go 用量限制支持解析“若干天/小时后重置”的自然语言时间；Antigravity Sonnet 4.6 迁移保留显式 Sonnet 4.5 路由。
  - 支付成功页完成余额刷新；Composite 新增 Kimi Code K3/K3-256K 路由；Channel Monitor v2 将 composite 分组错误归因到具体账号平台。
  - 更新 Grok/OpenAI 相关兼容测试和赞助商资源，版本同步至 `0.1.182`。
- 数据库迁移：本次上游范围没有新增数据库迁移文件。
- 定制代码影响：
  - 本次修改集中在后端网关兼容、计费、调度、支付结果和少量前端支付页，未触及 `site_favicon` 设置链路、OpenResty 脚本或 Compose 定制。
  - `site_favicon` 独立设置、USDT/卡网充值入口、深色主题、部署文档和 ACR 镜像配置均保留；定制专项测试通过。
  - `deploy/docker-compose.yml` 仍使用阿里云 ACR `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名仍为 `xingliux`。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check e530cea183d5d63f1317e5286616105eadb25792 e6ca09498d85c88ea97238ab3979aaabccca1cf5`：通过。
  - Go `1.27.0` 下执行 `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - OpenAI Lite/WS、计费、支付、Antigravity、Composite、Channel Monitor 专项测试：通过。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
  - `pnpm exec vitest run src/components/layout/__tests__/AppSidebar.spec.ts src/views/user/__tests__/USDTRechargeView.spec.ts src/views/user/__tests__/PaymentResultView.spec.ts src/views/admin/__tests__/SettingsView.spec.ts`：`4` 个测试文件、`58` 个测试全部通过；仅有既有的 `router-link` mock 和 Browserslist 数据过期提示。
  - `bash deploy/tests/docker-compose-gateway-env-test.sh`：通过。
- 镜像或部署验证：已基于提交 `a4eb01c62eff1bc71f232f4d7208470aff585da8` 完成 `linux/amd64` Docker build/push；镜像内置版本为 `0.1.182`、提交号为 `a4eb01c62eff1bc71f232f4d7208470aff585da8`，本地镜像 ID 为 `sha256:b59430c0d6b5dbbbdf5bd44679a76157938e791649ed93533915e8fd3faba605`，ACR `latest` manifest digest 为 `sha256:c46533f16a0c5340021352ba3e82415b985a53b395fe556566feb2b8f5d77e6d`。镜像运行时版本、远端清单回读和 `docker pull` 均验证通过，尚未更新生产服务。
- 合入总结：
  - 本次同步重点提升 OpenAI Responses Lite/WS 工具调用可靠性、Anthropic cache TTL 计费准确性、OpenCode/Antigravity/Grok 兼容性，以及支付余额和 Composite/Monitor 归因正确性。
  - 本次发布无需新增数据库迁移，`0.1.182` 镜像已重新构建并推送；生产部署后重点验证 Responses Lite 长连接工具调用、Anthropic 缓存计费、支付成功余额刷新和 Kimi K3 路由。

### 2026-08-25：同步 upstream/main 至 0.1.181

- 合入前定制分支提交：`f7c6c6fa92f768927f9d8b62c4ee97def55f7b09`
- 上游共同基线提交：`07931bbb180f3daea600156b92f423cbf0235325`
- 本次合入的上游目标提交：`e2d9b823f63dc4e8f4014be3fd24a0a73e339867`
- 上游提交范围：`07931bbb180f3daea600156b92f423cbf0235325..e2d9b823f63dc4e8f4014be3fd24a0a73e339867`
- 上游最新提交日期：`2026-08-24T14:35:57Z`
- 上游提交数量：`5`（其中非合并提交 `3`）
- 变更范围：`12` 个文件，新增 `115` 行，删除 `50` 行
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`b8ec9869fba88a75459b037b26cdf55ed0b0035d`
- 关联上游 PR、Issue 或 Release：PR `#6150`、`#6116`；上游版本更新为 `0.1.181`
- 主要变更：
  - Gemini 工具 schema 清理新增 `deprecated` 字段剔除；将枚举中的布尔值、数字和 `null` 规范化为字符串，对包含对象等非标量值的枚举直接丢弃，避免上游 schema 校验失败。
  - Grok/XAI CLI 身份版本从 `0.2.114` 更新至 `0.2.120`，OAuth、模型观测、计费探测和原始 Chat Completions 请求统一使用官方 CLI User-Agent 与请求头；保留安全的环境变量版本覆盖规则。
- 数据库迁移：本次上游范围没有新增数据库迁移文件。
- 定制代码影响：
  - 本次修改集中在 Gemini/Grok 后端兼容层，未触及设置、前端、数据库迁移或部署文件。
  - `site_favicon` 独立设置、USDT/卡网充值入口、深色主题、OpenResty 脚本和部署文档均保留；定制专项测试通过。
  - `deploy/docker-compose.yml` 仍使用阿里云 ACR `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名仍为 `xingliux`。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check f7c6c6fa92f768927f9d8b62c4ee97def55f7b09 b8ec9869fba88a75459b037b26cdf55ed0b0035d`：通过。
  - `go test ./internal/service ./internal/pkg/xai ./internal/repository -run 'Test(CleanToolSchema|SyncGrokObservedModels|BuildGrok|ForwardGrok|ApplyGrokCLI|HTTPUpstream).*' -count=1`：通过。
  - Go `1.27.0` 下执行 `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
  - `pnpm exec vitest run src/components/layout/__tests__/AppSidebar.spec.ts src/views/user/__tests__/USDTRechargeView.spec.ts src/views/admin/__tests__/SettingsView.spec.ts`：`3` 个测试文件、`44` 个测试全部通过；仅有既有的 `router-link` mock 和 Browserslist 数据过期提示。
  - `bash deploy/tests/docker-compose-gateway-env-test.sh`：通过。
- 镜像或部署验证：已基于提交 `e30521eae1b3e10f15b198a34f9828551b6a3b7a` 完成 `linux/amd64` Docker build/push；镜像内置版本为 `0.1.181`、提交号为 `e30521eae1b3e10f15b198a34f9828551b6a3b7a`，本地镜像 ID 为 `sha256:c2a14a39a2326c2478ec85827183514b5eb10ebf9c9044190372265404826e37`，ACR `latest` manifest digest 为 `sha256:e76d3274d3472e52600f1a6e49e699cc48b2906c9a28f3e4d44397a4108bc888`。镜像运行时版本、远端清单回读和 `docker pull` 均验证通过，尚未更新生产服务。
- 合入总结：
  - 本次同步提升 Gemini 工具 schema 对 OpenAPI/JSON Schema 边界值的兼容性，并让 Grok OAuth、模型列表与计费探测跟随官方 CLI 身份。
  - 本次发布无需新增数据库迁移，`0.1.181` 镜像已重新构建并推送；生产部署后重点验证 Gemini 工具枚举、Grok OAuth 请求头和 XAI 计费探测。

### 2026-08-24：同步 upstream/main 的 0.1.180 后续修复

- 合入前定制分支提交：`5bf615ae36edd4daefeeeadd325a28012f73f831`
- 上游共同基线提交：`03e8ab41346b42de9ece4e3e5bfcb6ca2b8cb57e`
- 本次合入的上游目标提交：`07931bbb180f3daea600156b92f423cbf0235325`
- 上游提交范围：`03e8ab41346b42de9ece4e3e5bfcb6ca2b8cb57e..07931bbb180f3daea600156b92f423cbf0235325`
- 上游最新提交日期：`2026-08-24T22:01:14+08:00`
- 上游提交数量：`4`（其中非合并提交 `2`）
- 变更范围：`4` 个文件，新增 `130` 行，删除 `8` 行
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`c669d7759edc51039295ddb92fd5a024b05e1208`
- 关联上游 PR、Issue 或 Release：PR `#6148`、`#6143`；上游版本仍为 `0.1.180`
- 主要变更：
  - Responses Lite 将顶层工具移动到 `input` 的 `additional_tools` 项后，仍能识别请求携带工具并保留 `parallel_tool_calls: false`，避免 OpenAI 按默认并行模式处理并返回 `unsupported_value`。
  - OpenAI Responses 因某类输入项的 `status` 字段被拒绝时，一次性清理所有同类型输入项的 `status`，避免逐项重试耗尽有限的重试次数；其他类型输入项保持不变，无类型信息时仍按原逻辑只清理被点名项。
- 数据库迁移：本次上游范围没有新增数据库迁移文件。
- 定制代码影响：
  - 本次仅修改后端 OpenAI 请求规范化和 rejected 字段重试逻辑，未触及设置、前端、数据库迁移或部署文件。
  - `site_favicon` 独立设置、USDT/卡网充值入口、深色主题、OpenResty 脚本和部署文档均保留；定制专项测试通过。
  - `deploy/docker-compose.yml` 仍使用阿里云 ACR `xingliux:latest` 镜像，主容器名仍为 `xingliux`。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check 5bf615ae36edd4daefeeeadd325a28012f73f831 c669d7759edc51039295ddb92fd5a024b05e1208`：通过。
  - `go test ./internal/service -run 'Test.*(Rejected|ParallelTool|AdditionalTools|Reasoning)' -count=1`：通过。
  - Go `1.27.0` 下执行 `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
  - `pnpm exec vitest run src/components/layout/__tests__/AppSidebar.spec.ts src/views/user/__tests__/USDTRechargeView.spec.ts src/views/admin/__tests__/SettingsView.spec.ts`：`3` 个测试文件、`44` 个测试全部通过；仅有既有的 `router-link` mock 和 Browserslist 数据过期提示。
  - `bash deploy/tests/docker-compose-gateway-env-test.sh`：通过。
- 镜像或部署验证：已基于提交 `665b302d464f291bd98fef59472017f566b8e98e` 完成 `linux/amd64` Docker build/push；镜像内置版本为 `0.1.180`、提交号为 `665b302d464f291bd98fef59472017f566b8e98e`，本地镜像 ID 为 `sha256:02e341c758304254d7db30927f1ee6b784ded8d6d772aea7ba88e24476e413d9`，ACR `latest` manifest digest 为 `sha256:deb509b9f1fa6aec8cfb020e895c8fe28115c88dff9f7a3b749a6be0366fcb06`。镜像运行时版本、远端清单回读和 `docker pull` 均验证通过，尚未更新生产服务。
- 合入总结：
  - 本次同步解决 Responses Lite 串行工具参数被误删，以及同类型 rejected `status` 逐项清理导致重试预算耗尽的问题。
  - 上游版本号和迁移集合均未变化，本次代码已重新构建并推送；生产部署后重点验证 Responses Lite 工具调用和长对话重放兼容性。

### 2026-08-24：同步 upstream/main 至 0.1.180

- 合入前定制分支提交：`a8221fcb30bc64e64b9dcb432a9df753a211249c`
- 上游共同基线提交：`d45135d87df16d48637f04ccd245727bc955ba54`
- 本次合入的上游目标提交：`03e8ab41346b42de9ece4e3e5bfcb6ca2b8cb57e`
- 上游提交范围：`d45135d87df16d48637f04ccd245727bc955ba54..03e8ab41346b42de9ece4e3e5bfcb6ca2b8cb57e`
- 上游最新提交日期：`2026-08-24T07:30:34Z`
- 上游提交数量：`70`（其中非合并提交 `45`）
- 变更范围：`276` 个文件，新增 `18347` 行，删除 `1121` 行
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`eff65f347e88d10317db34984d9daf8eccbcfef5`
- 关联上游 PR、Issue 或 Release：上游版本更新为 `0.1.180`
- 主要变更：
  - 新增插件系统，包含插件包与 manifest 规范、gRPC 运行时、兼容性与安全校验、仓储和管理服务、OAuth 出站传输接入，以及管理端插件安装、启停和配置页面。
  - OpenAI Responses、Chat Completions 和 WebSocket 全链路支持 Fast `service_tier`，计费按上游实际返回档位只降不升；增强流式终止输出、工具调用身份、OAuth 账号模型同步和 Responses Lite 串行工具兼容。
  - OpenAI 重置卡支持按用量阈值自动执行，补充重置工作流、额度检查、父子账号约束和管理端配置。
  - 渠道分时计价新增工作日规则和统一 token 计费路径；模型广场展示工作日时段、上下文阶梯单价和倍率叠加口径。
  - 新增模型列表读取上限；运维错误详情支持返回列表并保留筛选状态，修复 cgroup/宿主机内存指标混用。
  - 修复国产平台 Anthropic 用量 token 归一化、带方括号 IPv6 代理解析、用户并发 `0` 表示无限、账号优先级默认展示，以及 Compose 网关环境变量和强制 HTTP 透传。
  - Go 工具链升级至 `1.27.0`，升级 golangci-lint/gosec 规则并逐点处理安全告警；升级 DOMPurify 以修复多项 sanitizer bypass XSS 风险。
- 新增数据库迁移：
  - `backend/migrations/229_plugins.sql`
  - `backend/migrations/230_plugin_artifacts.sql`
  - 两个迁移分别创建插件元数据/状态存储和插件制品字段；生产升级必须确认容器启动迁移机制成功执行全部未执行迁移，不能只按数字手工挑选一个文件。
- 定制代码影响：
  - `site_favicon` 独立设置的存储、管理端上传、公开 API、SSR 注入和运行时更新链路均保留；专项测试全部通过。
  - `deploy/docker-compose.yml` 仍使用阿里云 ACR 镜像 `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名仍为 `xingliux`，并合入上游新增网关环境变量。
  - USDT 充值页、卡网充值菜单及其迁移、深色主题、OpenResty 脚本、安装手册、`BUILD.md` 和本文档均保留；对应迁移和前端测试通过。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件；合并后逐项核对共享设置、侧边栏、路由、品牌和部署文件，确认上游插件入口与 `xingliux` 定制共存。
- 验证结果：
  - `git diff --check a8221fcb30bc64e64b9dcb432a9df753a211249c eff65f347e88d10317db34984d9daf8eccbcfef5`：通过。
  - Go `1.27.0` 下执行 `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `pnpm run typecheck`：通过。
  - 首次 `pnpm run test:run` 的 `246` 个测试文件、`1750` 个断言均通过，但全量并行期间捕获到一次 `AccountsView.selectAllResults.spec.ts` 未处理异步错误；该用例单独重跑通过，随后完整重跑也以 `246` 个测试文件、`1750` 个测试全部通过结束。
  - `pnpm run build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
  - `go test ./migrations -count=1 -v`：通过，包含插件 `229/230` 和卡网充值 `224` 迁移专项测试。
  - `bash deploy/tests/docker-compose-gateway-env-test.sh`：通过。
- 镜像或部署验证：已基于提交 `07808977b928217a247e62f16b44677417dfc19d` 完成 `linux/amd64` Docker build/push；镜像内置版本为 `0.1.180`、提交号为 `07808977b928217a247e62f16b44677417dfc19d`，本地镜像 ID 为 `sha256:c30c5b562157bbbffea7839bf46ddc7b7da5bf7d7b5b306148ba78330fe4cdc7`，ACR `latest` manifest digest 为 `sha256:e0a19fb5653b10f13024f5ba81bcecc0679534d84d10ded0496d73211f43733e`。远端清单回读和 `docker pull` 均验证通过，尚未更新生产服务。
- 合入总结：
  - 本次同步核心是可管理的插件运行时、OpenAI Fast 档位与计费、自动重置卡、渠道分时计价和模型广场价格披露，并完成 Go 1.27 与前端安全依赖升级。
  - `0.1.180` 已使用 Go `1.27.0` 构建并发布；生产部署时需确认插件迁移 `229/230` 成功，并重点验证插件安装/启停、Fast 档位计费、自动重置卡、工作日分时价格和既有充值/favicon 定制。

### 2026-08-23：同步 upstream/main 至当前 0.1.179

- 合入前定制分支提交：`06e3ec210011a0c8cd1af9d2b1891f2d2bf335d1`
- 上游共同基线提交：`2bc139ab527b4a687546d145dc7bb9063cf14510`
- 本次合入的上游目标提交：`d45135d87df16d48637f04ccd245727bc955ba54`
- 上游提交范围：`2bc139ab527b4a687546d145dc7bb9063cf14510..d45135d87df16d48637f04ccd245727bc955ba54`
- 上游最新提交日期：`2026-08-22T13:41:42+08:00`
- 上游提交数量：`106`（其中非合并提交 `73`）
- 变更范围：`268` 个文件，新增 `21690` 行，删除 `1939` 行
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`36b0b38577b26d15830e5908eb28d5d6e16f2b68`
- 关联上游 PR、Issue 或 Release：上游仍为 `0.1.179`，本次为版本发布后的大批功能与修复同步
- 主要变更：
  - Ollama Cloud 请求新增 `max_tokens` 上限收敛，并将 Chat Completions 思维字段兼容为 `reasoning_content`。
  - OpenAI OAuth 图片生成、父账号自动审核、文本账号调度和 sticky hash 得到修复；增强 API Key 健康熔断、账号状态切换、Guardian affinity、compact fallback、Responses 输入与工具 schema 兼容。
  - OpenAI WebSocket/HTTP bridge 增强会话抢占、状态恢复和重放去重，修复重复或孤立工具调用、非法工具参数、失败响应透传及流式刷新等边界问题。
  - DeepSeek 原生 Responses 支持客户端自定义工具，账号测试按平台和协议选择正确端点；国产供应商余额、配额探测及 Anthropic 原生直通兼容同步增强。
  - Grok 默认模型迁移至 `grok-4.6`，完善 Realtime 预连接、429/容量/stream idle/compaction 重试、用量计费、媒体尺寸和内容拒绝兼容。
  - Composite 分组放行 Messages 和视频生成端点；Chat Completions 文件输入转换为 Responses `input_file`，并加强 malformed tool call、Responses/Chat 生命周期与终止用量兼容。
  - 修复 Gemini/Antigravity 模型目录和官方用量端点、前端 token refresh 锁循环、模型广场入口、运维错误详情以及安全审计日志噪声。
- 数据库迁移：本次上游范围未新增数据库迁移文件。
- 定制代码影响：
  - `site_favicon` 独立设置的存储、管理端上传、公开 API、SSR 注入和运行时更新链路均保留；专项测试全部通过。
  - `deploy/docker-compose.yml` 仍使用阿里云 ACR 镜像 `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名仍为 `xingliux`。
  - 用户充值菜单、深色主题、OpenResty 脚本、安装手册和 `BUILD.md` 等定制均保留，相关前端测试通过。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check 06e3ec210011a0c8cd1af9d2b1891f2d2bf335d1 36b0b38577b26d15830e5908eb28d5d6e16f2b68`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `pnpm run typecheck`：通过。
  - `pnpm run test:run`：`241` 个测试文件、`1702` 个测试全部通过。
  - `pnpm run build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：已基于提交 `82cd0c0353f168bb1cf3a535271665fd6cef11b0` 完成 `linux/amd64` Docker build/push；镜像内置版本为 `0.1.179`、提交号为 `82cd0c0353f168bb1cf3a535271665fd6cef11b0`，ACR `latest` manifest digest 为 `sha256:b843bcbfb3028176c0fccf7b75af5955617f106717991dd39eece425d16b91fb`。远端清单回读和 `docker pull` 均验证通过，尚未更新生产服务。
- 合入总结：
  - 本次同步重点是 OpenAI Responses/WS/compact 与工具兼容、Grok 4.6 和重试计费、DeepSeek 原生 Responses 工具，以及 Ollama Cloud 请求兼容。
  - `xingliux` 的 favicon、充值入口、主题、ACR 镜像地址和生产容器命名定制均已保留；后续发布应重点验证 OpenAI 长连接和工具续接、Grok 重试计费、DeepSeek 自定义工具及 Ollama Cloud 思维内容。

### 2026-08-20：同步 upstream/main 至 0.1.179

- 合入前定制分支提交：`7a4ec3a63f6a9a521224557a8a0d9fd04e718646`
- 上游共同基线提交：`1b5dc676a9d35532ac2d88dbbe0ee2638b2ab05f`
- 本次合入的上游目标提交：`2bc139ab527b4a687546d145dc7bb9063cf14510`
- 上游提交范围：`1b5dc676a9d35532ac2d88dbbe0ee2638b2ab05f..2bc139ab527b4a687546d145dc7bb9063cf14510`
- 上游最新提交日期：`2026-08-20T07:06:50Z`
- 上游提交数量：`17`（其中非合并提交 `11`）
- 变更范围：`50` 个文件，新增 `2610` 行，删除 `185` 行
- 合入方式：`git merge --no-ff --no-edit upstream/main`
- 合入后提交：`ae0c182b7a0ef509cfd3710c14d7204be25c7da0`
- 关联上游 PR、Issue 或 Release：上游版本更新为 `0.1.179`
- 主要变更：
  - 为 Kimi、智谱、DeepSeek 账号新增 adaptive API protocol，可按入站协议在 Chat Completions、Anthropic 和 Responses 端点之间路由；管理端创建、编辑、预览和账号测试流程同步支持各协议端点。
  - 增强 Responses 工具兼容和 tool-search discovery，将发现的工具提升为可调用工具，并补充跨轮次 WS bridge 工具处理。
  - 支持配置代理探测目标，增加探测 URL 校验、默认配置和格式化处理，避免使用无效或不安全的探测地址。
  - 修复自适应协议兼容性、OpenAI API Key Responses 探测、Grok 工具搜索、模型配置错误 SLA 统计和管理员角色选择样式。
  - 移除遗留 README 赞助商内容及无效合作方 Logo 资源；版本同步至 `0.1.179`。
- 数据库迁移：本次上游范围未新增数据库迁移文件。
- 定制代码影响：
  - `site_favicon` 独立设置存储、管理端上传、公开 API、SSR 注入和运行时更新链路均保留。
  - `deploy/docker-compose.yml` 仍使用阿里云 ACR 镜像 `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名仍为 `xingliux`；OpenResty 脚本、安装手册和 `BUILD.md` 均保留。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check 7a4ec3a63f6a9a521224557a8a0d9fd04e718646 ae0c182b7a0ef509cfd3710c14d7204be25c7da0`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `pnpm typecheck`：通过。
  - `pnpm run test:run`：`239` 个测试文件、`1672` 个测试全部通过。
  - `pnpm run build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：本次仅完成本地上游合入和代码验证，未执行本次 `0.1.179` Docker build/push，也未在生产服务器执行迁移或重启；生产发布前应构建并推送新的 ACR `latest` 镜像。此前 ACR 中的镜像仍对应 `0.1.178`。
- 合入总结：
  - 本次同步重点是国产模型 adaptive 协议路由、Responses/tool-search 工具兼容、代理探测目标配置，以及 OpenAI/Grok/SLA 相关修复。
  - `xingliux` 的 favicon、ACR 镜像地址和生产容器命名定制均已保留；发布后应重点验证国产平台不同协议端点、代理探测 URL 和 OpenAI Responses 工具链。

### 2026-08-20：同步 upstream/main 至当前 0.1.178

- 合入前定制分支提交：`b2b09badef02b034651de86ec5cb16ca880195f2`
- 上游共同基线提交：`49504adc98d2b6d539491e865a340e644548979e`
- 本次合入的上游目标提交：`1b5dc676a9d35532ac2d88dbbe0ee2638b2ab05f`
- 上游提交范围：`49504adc98d2b6d539491e865a340e644548979e..1b5dc676a9d35532ac2d88dbbe0ee2638b2ab05f`
- 上游最新提交日期：`2026-08-20T10:13:17+08:00`
- 上游提交数量：`62`（其中非合并提交 `39`）
- 变更范围：`183` 个文件，新增 `7005` 行，删除 `1345` 行
- 合入方式：`git merge --no-ff --no-edit upstream/main`
- 合入后提交：`549983fae7677ab6bfc06e0ffc5933ec1732e736`
- 关联上游 PR、Issue 或 Release：上游仍为 `0.1.178`，本次为版本发布后的功能与修复同步
- 主要变更：
  - 新增渠道服务层级与区间倍率定价，补充长上下文计费、Anthropic Fast 请求计费和模型价格解析，支持渠道分时/分层倍率参与实际计费。
  - 扩展复合平台路由，支持 Codex endpoints 和国产模型平台；放宽已解析 Grok/CN 目标的消息分发门控，并新增 `227_composite_routes_add_cn_providers.sql`。
  - 国产模型账号支持请求头覆写，修复账号测试路由、配额标签布局和监控配额数据源校验。
  - 增强 OpenAI Responses/Chat/WS：支持 429 后续 turn 恢复、WS bridge 保留 client tools、缓冲读取失败故障转移、Responses 输入 token 预探测、容量恢复和 reasoning 缓存回注。
  - 增强 Grok 4.6 工具链：修复内联图片与 `view_image` 冲突，支持多入口图片工具协议，并保持 `xhigh` effort；同时降低 Codex tool-search discovery 输出。
  - 优化 Usage 聚合、网关 reasoning 缓存和请求模型记录；移除遗留 Sora 引用，修复管理端平台筛选及国产平台前端展示。
- 新增数据库迁移：
  - `backend/migrations/226_add_usage_log_effective_model_indexes_notx.sql`
  - `backend/migrations/227_composite_routes_add_cn_providers.sql`
  - `backend/migrations/228_channel_pricing_multipliers.sql`
  - 当前仓库同时存在 `226_channel_monitor_quota_mode.sql` 等既有 `226` 迁移；迁移系统按完整文件名和 checksum 独立管理，生产发布时不得只执行单个数字编号。
- 定制代码影响：
  - `site_favicon` 独立设置链路仍完整保留，favicon 专项测试通过。
  - `deploy/docker-compose.yml` 仍使用阿里云 ACR 镜像 `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名仍为 `xingliux`；OpenResty 脚本、安装手册和 `BUILD.md` 均保留。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check b2b09badef02b034651de86ec5cb16ca880195f2 549983fae7677ab6bfc06e0ffc5933ec1732e736`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `pnpm typecheck`：通过。
  - `pnpm run test:run`：`238` 个测试文件、`1660` 个测试全部通过。
  - `pnpm run build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：本次仅完成本地上游合入和代码验证，未执行 Docker build/push，也未在生产服务器执行迁移或重启；发布前应先执行当前仓库全部未执行迁移，再构建并推送 ACR `latest` 镜像。
- 合入总结：
  - 本次同步重点是渠道倍率计费、复合平台/CN provider 路由、OpenAI/Codex 流式恢复与工具兼容，以及 Grok 图片工具和 Usage 聚合修复。
  - `xingliux` 的 favicon、ACR 镜像地址和生产容器命名定制均已保留；生产升级需重点验证渠道倍率计费、复合平台路由和 OpenAI WS 长请求恢复。

### 2026-08-19：同步 upstream/main 至 0.1.178

- 合入前定制分支提交：`60d91ca828db3a42f0f4fded6ba5a230ad7904c9`
- 上游共同基线提交：`baeac1f3de21d37b129405f092ef86c24b3f203d`
- 本次合入的上游目标提交：`49504adc98d2b6d539491e865a340e644548979e`
- 上游提交范围：`baeac1f3de21d37b129405f092ef86c24b3f203d..49504adc98d2b6d539491e865a340e644548979e`
- 上游最新提交日期：`2026-08-18T10:03:19Z`
- 上游提交数量：`107`（其中非合并提交 `68`）
- 变更范围：`301` 个文件，新增 `19904` 行，删除 `1017` 行
- 合入方式：`git merge --no-ff --no-edit upstream/main`
- 合入后提交：`9728f6e7413819f2975a04d4ce48b96893fbeab8`
- 关联上游 PR、Issue 或 Release：上游版本 `0.1.178`
- 主要变更：
  - 新增 Kimi、智谱、DeepSeek 等国产模型平台支持，补充平台分组、余额、配额、渠道能力和管理端账号配置。
  - 新增 Channel Monitor 配额模式、配额抓取服务及管理端/用户端配额展示，支持按渠道模型配置分时倍率定价。
  - 增强 OpenAI/Codex fingerprint、Team 联动熔断、自定义 tools、Anthropic 原生兼容和 SSE 流处理；修复 Gemini 工具调用兼容性与错误策略边界。
  - 修复邀请码注册竞态、计费完整性、Grok 用量和多项管理端/用户端交互问题；后端默认 Go builder 升级为 `golang:1.26.6-alpine`。
- 新增数据库迁移：
  - `backend/migrations/224_user_platform_quotas_add_cn_providers.sql`
  - `backend/migrations/225_backfill_codex_fingerprint_seed.sql`
  - `backend/migrations/225_channel_model_time_pricing.sql`
  - `backend/migrations/226_channel_monitor_quota_mode.sql`
  - 两个 `225` 前缀迁移按完整文件名和 checksum 独立管理，生产发布时需按项目迁移机制执行全部 4 个文件。
- 定制代码影响：
  - `site_favicon` 独立设置的存储、管理端上传、公开 API、SSR 注入和运行时更新链路均保留。
  - 生产 `deploy/docker-compose.yml` 继续使用阿里云 ACR 镜像 `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名保持为 `xingliux`；OpenResty 脚本、安装手册和 `BUILD.md` 定制未被覆盖。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check 60d91ca828db3a42f0f4fded6ba5a230ad7904c9 9728f6e7413819f2975a04d4ce48b96893fbeab8`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `pnpm typecheck`：通过。
  - `pnpm run test:run`：`230` 个测试文件中 `229` 个通过、`1` 个失败；`1625/1626` 个测试通过。失败为上游 `CreateAccountModal.grok.spec.ts` 对 `? 'xai-...'` 旧三元表达式文本的断言，当前上游源码已重构为 `apiKeyValuePlaceholder` computed，属于上游测试与源码不同步，非本次定制改动引入。
  - `pnpm run build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：本次仅完成本地上游合入，未执行 Docker build/push，也未在生产服务器执行迁移或重启；发布前应先执行上述 `224`、`225`、`226` 迁移，再构建并推送 ACR `latest` 镜像。
- 合入总结：
  - 本次同步重点是国产模型平台与配额能力、Channel Monitor 配额模式、分时倍率定价，以及 OpenAI/Codex、Anthropic、Gemini 兼容性增强。
  - `xingliux` 的 favicon、ACR 镜像地址和生产容器命名定制均已保留；生产升级必须把数据库迁移与镜像升级作为同一发布步骤核对。

### 2026-08-16：同步 upstream/main 至 0.1.177

- 合入前定制分支提交：`6a5e67cb5d0c534a2ce7c31ba2b68e0ffe2d3e80`
- 上游共同基线提交：`fbfdcef8184ae4b2e224d5cfc47cf1d0e3742710`
- 本次合入的上游目标提交：`baeac1f3de21d37b129405f092ef86c24b3f203d`
- 上游提交范围：`fbfdcef8184ae4b2e224d5cfc47cf1d0e3742710..baeac1f3de21d37b129405f092ef86c24b3f203d`
- 上游最新提交日期：`2026-08-15T13:40:21Z`
- 上游提交数量：`13`（其中非合并提交 `10`）
- 变更范围：`68` 个文件，新增 `4413` 行，删除 `311` 行
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`07eef8e66f1636da31f4ed7e9949d723951258dd`
- 关联上游 PR、Issue 或 Release：上游版本 `0.1.177`，包含 Codex turn-state/fingerprint、远程 compaction v2 和分组用量日报汇总相关合并请求
- 主要变更：
  - OpenAI/Codex 请求新增 turn-state 透传、跨账号回显隔离和相关响应处理，避免上游状态在不同账号之间串用。
  - Codex fingerprint 收敛改为 opt-in，并补充自动透传场景的兼容处理和管理端配置。
  - 增加原生 compaction v2 探测、路由与 Responses compact 处理，区分原生和 legacy compaction 路径。
  - 新增分组用量日报汇总、后台持久水位和失效触发器，补充分组用量管理端摘要、趋势统计及清理逻辑。
  - 新增数据库迁移 `222_group_usage_daily_rollups.sql` 和 `223_group_usage_rollup_timezone.sql`：创建分组用量日桶及发布状态，并让日桶跟随服务端配置时区重建。
  - 修复分组用量仓储测试时区、CI 失败、账号调度和 compact 相关边界问题；版本更新至 `0.1.177`。
- 定制代码影响：
  - `site_favicon` 的设置存储、管理端上传、公开 API、SSR 注入和运行时更新链路均保留；独立 favicon 回归测试通过。
  - 生产 `deploy/docker-compose.yml` 继续使用阿里云 ACR 镜像 `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，主容器名保持为 `xingliux`；OpenResty 脚本、安装手册和 `BUILD.md` 定制未被覆盖。
  - 本次新增迁移需在发布 `0.1.177` 前执行 `222`、`223`，并核对分组用量日报的配置时区和历史回填状态。
- 冲突处理：无。Git `ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check 6a5e67cb5..07eef8e66`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `make build`（backend）：通过，构建版本为 `0.1.177`。
  - `pnpm typecheck`：通过。
  - `pnpm test:run`：`223` 个测试文件、`1549` 个测试全部通过。
  - `pnpm build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：已完成 Docker build/push，使用 `GOLANG_IMAGE=golang:1.26.6-alpine`（因 `backend/go.mod` 要求 Go `>=1.26.6`）和 `NPM_CONFIG_REGISTRY=https://registry.npmmirror.com` 构建 `0.1.177`；ACR `latest` 推送成功，远端 digest 为 `sha256:ce309557f55538654a76708efa283d0efd9f1812e1965a50131e6724b37414c`。尚未在生产服务器执行 `docker compose pull/up`，也未执行迁移。
- 合入总结：
  - 本次同步重点是 OpenAI/Codex turn-state 与 fingerprint opt-in、原生 compaction v2、分组用量日报汇总及其时区支持。
  - `xingliux` 的 favicon、ACR 镜像地址和生产容器命名定制均已保留；`0.1.177` 镜像已推送到 ACR，生产发布前仍应先执行迁移 `222`、`223`，再在服务器拉取并重启服务，重点验证 OpenAI/Codex 长请求透传和分组用量日报。

### 2026-08-13：同步 upstream/main 至 0.1.176

- 合入前定制分支提交：`d8721a858ff2a9578c3d90371dfc688c943d0a4d`
- 上游共同基线提交：`5935e674a84341c3536e27e6a968384f67d9062b`
- 本次合入的上游目标提交：`fbfdcef8184ae4b2e224d5cfc47cf1d0e3742710`
- 上游提交范围：`5935e674a84341c3536e27e6a968384f67d9062b..fbfdcef8184ae4b2e224d5cfc47cf1d0e3742710`
- 上游最新提交日期：`2026-08-13T10:32:07+08:00`
- 上游提交数量：`26`（其中非合并提交 `20`）
- 变更范围：`98` 个文件，新增 `3746` 行，删除 `299` 行
- 合入方式：`git merge --no-ff --no-edit upstream/main`
- 合入后提交：`84226fc1b166dc323b73e83ac75ded2e8b7ad2cd`
- 关联上游 PR、Issue 或 Release：上游版本 `0.1.176`，包含 PR `#5573` 等上游合并请求
- 主要变更：
  - Grok 新增 `grok-4.6` 模型目录、官方定价和请求路径支持，并从 JWT tier 识别订阅档位；刷新凭证后可覆盖失效的订阅信息。
  - Grok 长上下文策略改为由分组开关控制，支持逐模型定价和关闭长上下文阶梯；未知文本模型安全回退到文本价卡，媒体族不会误套用文本模型。
  - 新增独立 `/x_search` 原生搜索接口；Chat 与 Responses 往返保留 `x_search` 并抽取 sources，搜索计费继续沿用现有计费链路。
  - 修复 Grok Realtime 仅在观察到音频后计费、SuperGrokPro Heavy 窗口识别和容量抖动隔离；账号徽章与用量格改按实时档位展示。
  - 新增分组逐模型定价配置及管理端编辑能力，并增加 `221_group_model_pricing.sql` 迁移；迁移为 groups 增加长上下文定价开关和模型定价 JSONB 字段。
  - 定时备份新增 leader 锁，避免多实例重复执行；分组平台变化时主动失效频道缓存；Responses 探测未完成时保留未知状态，不再误判为上游不支持。
  - 账号页自动刷新偏好改为模块初始化时恢复，账号用量刷新、Grok 订阅档位和模型白名单相关前端展示与测试同步更新。
- 定制代码影响：
  - `site_favicon` 的设置存储、管理端上传、公开 API、SSR 注入和运行时更新链路均保留；favicon 专项测试全部通过。
  - 生产 `deploy/docker-compose.yml` 继续使用阿里云 ACR 镜像 `crpi-b1po1b8mfjqfuj2k.cn-shenzhen.personal.cr.aliyuncs.com/skyzcstack/xingliux:latest`，容器名保持为 `xingliux`；OpenResty 脚本、安装手册和 `BUILD.md` 定制未被覆盖。
  - 生产部署需执行上游迁移 `backend/migrations/221_group_model_pricing.sql`，并在迁移后核对分组长上下文定价开关和逐模型定价配置。
- 冲突处理：无。Git `ort` 自动合并成功，仅自动合并 `frontend/src/types/index.ts`，未产生冲突文件。
- 验证结果：
  - `git diff --check d8721a858..84226fc1b`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `make build`（backend）：通过，构建版本为 `0.1.176`。
  - `pnpm typecheck`：通过。
  - `pnpm test:run`：`222` 个测试文件、`1547` 个测试全部通过。
  - `pnpm build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：未执行。本次只完成本地上游合入和代码验证；ACR `latest` 当前仍为已发布的 `0.1.175`，需要单独构建并推送后才包含 `0.1.176`。
- 合入总结：
  - 本次同步重点是 Grok 4.6/JWT 订阅和长上下文计费、原生 x_search、分组逐模型定价，以及备份和频道缓存可靠性改进。
  - `xingliux` 的 favicon、ACR 镜像地址和生产容器命名定制均已保留；发布前应先执行迁移 `221`，再构建并推送 `0.1.176` 镜像，重点验证 Grok 模型定价、x_search 计费和多实例备份行为。

### 2026-08-12：同步 upstream/main 至 0.1.175

- 合入前定制分支提交：`b67f838563672bda7eaf35e1767e9d53af0215bd`
- 上游共同基线提交：`48eb3766d2da817b171b45bb3036d42575e42b8f`
- 本次合入的上游目标提交：`5935e674a84341c3536e27e6a968384f67d9062b`
- 上游提交范围：`48eb3766d2da817b171b45bb3036d42575e42b8f..5935e674a84341c3536e27e6a968384f67d9062b`
- 上游最新提交日期：`2026-08-12T19:17:04+08:00`
- 上游提交数量：`85`（其中非合并提交 `48`）
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`94582c4963beca03ea73841fb542e89d438f0fdc`
- 关联上游 PR、Issue 或 Release：上游版本 `0.1.175`
- 主要变更：
  - 新增 Codex OAuth 设备指纹收敛，统一账号身份、请求头和设备会话信号，减少上游可见的重复设备与会话；同时加强 User-Agent 入库校验。
  - 加固 OpenAI Responses、Chat Completions 和 WebSocket v2 的流式恢复与 TTFT 统计：空 `response.completed`、图片流错误、无 delta 终止事件、keepalive 已提交但无 SSE、确定性 400 和 HTML 403 均按更准确的语义处理。
  - 增强 OpenAI 调度与账号健康判断：保留 Codex 容量指数退避和用量百分比，忽略过期快照，补充旧调度器排除诊断，并在透传池认证失败时先重试再 failover。
  - 新增安全的上游响应模型计费和计费完整性检查，账号成本支持 `service_tier` 定价；修复 Grok 缺少 usage 时的计费绕过，以及 API Key 配额和过期时间输入校验。
  - 完善大文件备份的分卷上传、恢复和 S3 存储测试；管理端 Usage 恢复 request ID 列，运营监控改善内存容量显示，简易模式下显示安全审计入口。
  - 修复 WebSocket 审计日志和同一 turn 去重、Cyber 风控审计范围、Gemini exclusive minimum 工具 Schema、Chat reasoning 别名、Composite 分组图片权限及个人订阅到期时间覆盖问题。
- 定制代码影响：
  - 本次上游未修改 `site_favicon` 的定制接线文件；已复核设置存储、管理端上传、公开 API、SSR 注入和运行时更新均完整保留。
  - ACR Compose 镜像地址、OpenResty 脚本、初次安装手册和 `BUILD.md` 均未被上游覆盖。
  - 合入前存在未提交的 `deploy/docker-compose.yml` 容器名修改（`sub2api` 改为 `xingliux`）；同步前已暂存，合入后原样恢复，未混入合并提交或本条记录提交。
  - 本次上游范围没有新增数据库迁移文件。
- 冲突处理：无。`ort` 自动合并成功，未产生冲突文件。
- 验证结果：
  - `git diff --check b67f83856..94582c496`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `make build`（backend）：通过，构建版本为 `0.1.175`。
  - `pnpm typecheck`：通过。
  - `pnpm test:run`：`222` 个测试文件、`1538` 个测试全部通过。
  - `pnpm build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：未执行。本次只完成本地上游合入和代码验证；ACR `latest` 仍是此前发布的 `0.1.173`，需要单独构建并推送后才包含 `0.1.175`。
- 合入总结：
  - 本次同步主要提升 Codex 身份一致性、OpenAI 流式容错、调度诊断和响应模型计费完整性，并完善大文件备份、安全审计及管理端可观测性。
  - `xingliux` 的独立 favicon 与生产部署定制均已保留；发布前应构建 `0.1.175` 镜像，部署后重点验证 OpenAI/Codex 流式请求、账号容量调度、响应模型计费及大文件备份恢复。

### 2026-08-09：同步 upstream/main 至 0.1.173

- 合入前定制分支提交：`858d9b55623840325e1d733a52419f1d7e08a4d8`
- 上游共同基线提交：`cc67b1aca1d3b590609abef2fcd3a6ca31c5c651`
- 本次合入的上游目标提交：`48eb3766d2da817b171b45bb3036d42575e42b8f`
- 上游提交范围：`cc67b1aca1d3b590609abef2fcd3a6ca31c5c651..48eb3766d2da817b171b45bb3036d42575e42b8f`
- 上游最新提交日期：`2026-08-09T08:26:22Z`
- 上游提交数量：`115`（其中非合并提交 `105`）
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`156163d5efc7bb6586f90a7136a3a7d9bbf1363d`
- 关联上游 PR、Issue 或 Release：上游版本 `0.1.173`
- 主要变更：
  - 新增 Channel Monitor v2：被动聚合表、分层保留、只读 API、v1/v2 模式门控、静默历史回填、聚合进度、隐私默认值，以及管理端和用户端 Ops 风格监控界面。
  - 大幅扩展 Grok：模型目录和可配置跨客户端映射、SSO/刷新凭证生命周期、free/P2 配额软门禁、stream idle 换号、team+model 冷却、账号测试和媒体预览。
  - Grok 网关新增 Voice TTS/STT/Realtime、自定义声音 CRUD/下载、`/v1/web_search`、搜索计费、按模型视频价格和分组音频/Voice 定价，并加固媒体完成状态与计费门控。
  - 新增邮箱域名注册额度策略及默认关闭的总开关；修复邮箱别名、配额统计和注册策略边界。
  - 修复 Gemini 池模式账号 429 误标账号级限流，原生生图改为按上游实际返回图片数计费；OpenAI 非流式生图在上游已接收后不再随客户端断开取消计费链路。
  - 优化上游响应模型观测性能，并修复前端回滚 timeout 断言和 `GroupsView` capability mock，清除了上一版本遗留的全量前端测试失败。
- 定制代码影响：
  - `site_favicon` 设置链路完整保留；上游对公开设置契约大幅重排后，重新核对了设置存储、管理端上传、公开 API、SSR 注入和运行时更新。
  - ACR Compose 镜像地址、OpenResty 脚本、安装手册和 `BUILD.md` 未被上游覆盖。
  - 部署时需执行上游新增的 Channel Monitor v2 迁移 `194_channel_monitor_v2.sql` 至 `206_channel_monitor_v2_privacy_defaults.sql`，以及 Grok 分组计价迁移 `217` 至 `220`；相同数字前缀的迁移按完整文件名/checksum 独立管理。
- 冲突处理：
  - `backend/internal/handler/dto/settings.go`
  - `backend/internal/handler/setting_handler.go`
  - `backend/internal/service/setting_public.go`
  - `backend/internal/service/settings_view.go`
  - 以上 4 个文件均采用上游 `0.1.173` 的完整字段结构，再恢复共 9 处 `SiteFavicon` 字段或映射；相对 `upstream/main` 的冲突文件差异仅剩预期的 favicon 接线。
- 验证结果：
  - `git diff --check upstream/main..156163d5e`：通过；合入完整范围中的 `docs/channel-monitor-v2-safe-defaults.md` 有 3 处上游 Markdown 强制换行双空格，按上游原文保留。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `pnpm typecheck`：通过。
  - `pnpm test:run`：`220` 个测试文件、`1529` 个测试全部通过，无失败和未处理错误。
  - `pnpm build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：未执行。本次只完成本地代码合入和验证，ACR `latest` 仍为已发布的 `0.1.172`，需要单独构建并推送后才包含 `0.1.173`。
- 合入总结：
  - 本次同步的主体是 Channel Monitor v2 和 Grok 完整能力整合，同时修复邮件注册配额、Gemini 图片计费及 OpenAI 生图断连计费问题。
  - `xingliux` 的独立 favicon 和生产部署配置已保留；发布前应构建新镜像，并在生产环境重点确认新增迁移、监控模式/隐私默认值、Grok 音视频与搜索计费配置。

### 2026-08-08：同步 upstream/main 至 0.1.172

- 合入前定制分支提交：`217a3747e93d62d8b01f96d21c38dfd0cb317572`
- 上游共同基线提交：`00b8596176809906993169c283671811ad04f58d`
- 本次合入的上游目标提交：`cc67b1aca1d3b590609abef2fcd3a6ca31c5c651`
- 上游提交范围：`00b8596176809906993169c283671811ad04f58d..cc67b1aca1d3b590609abef2fcd3a6ca31c5c651`
- 上游最新提交日期：`2026-08-08T10:58:53+08:00`
- 上游提交数量：`57`（其中非合并提交 `35`）
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`625ce123628645194815bb7dac058139cb75e4eb`
- 关联上游 PR、Issue 或 Release：上游版本 `0.1.172`
- 主要变更：
  - 修复 OAuth pending exchange 账号接管风险；完善腾讯验证码区域、票据过期处理和 CSP 白名单。
  - OpenAI OAuth 默认身份调整为 `codex-tui`，新增并加固路由提示，停止注入旧 beta 标记；Codex WebSocket 支持预热连接续用。
  - 修复 Responses 工具 Schema 中 `parameters.type: null`、Responses 转 Anthropic 非法 content block，以及流内降载错误在输出前无法 failover 等兼容性问题。
  - 新增上游实际响应模型审计和模型不匹配查询索引；管理端 Usage 页面可查看相关数据，并新增数据库迁移 `194`、`195`。
  - 修复金额写入 `NUMERIC(20,8)` 前未量化、订阅每日额度未在午夜重置、系统日志落库失败缺少退避、EasyPay 错误乱码等计费与运维问题。
  - 新增 Gemini 3.6 Flash、模型广场复合分组模型和 Grok 视频 task ID 支持；修复图片模型误冷却、Grok 405 failover、OAuth count-token HTML 错误误冷却等调度问题。
  - 上游连接增加显式 TCP 拨号超时，并将 `nanoid` 从 `3.3.16` 升级到 `3.3.17` 以修复安全审计告警。
- 定制代码影响：
  - `site_favicon` 定制链路完整保留：设置常量、默认值、管理端上传、公开设置、SSR 注入和运行时 favicon 更新均仍存在。
  - 设置解析和 `SettingsView.vue` 虽与上游改动重叠，但由 Git 自动合并且定制字段未被覆盖；ACR Compose 镜像地址、OpenResty 脚本和部署文档未被上游修改。
  - 部署 `0.1.172` 时必须正常执行数据库迁移 `194_add_usage_log_upstream_response_model.sql` 和 `195_add_usage_log_upstream_model_mismatch_index_notx.sql`。
- 冲突处理：无文本冲突；合并后人工核对了设置链路和 Compose/ACR 配置。
- 验证结果：
  - `git diff --check 217a3747e 625ce1236`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `pnpm typecheck`：通过。
  - `pnpm test:run`：`208/209` 个测试文件通过，`1477/1479` 个测试通过；仍有 `2` 个回滚 API 旧参数断言失败和 `10` 个 `GroupsView` 旧 mock 未处理错误，与上次合入记录相同，未由本次合入引入。
  - `pnpm exec vitest run src/components/__tests__/TencentCaptchaGate.spec.ts src/views/auth/__tests__/TencentCaptchaForgotPassword.spec.ts src/components/admin/usage/__tests__/UsageTable.spec.ts src/views/admin/__tests__/UsageView.spec.ts src/views/admin/__tests__/SettingsView.spec.ts`：`5` 个测试文件、`78` 个测试全部通过。
  - `pnpm build`：通过；仅有 Browserslist 数据过期、动态/静态混合导入和大分包提示。
  - `go test -tags embed ./internal/web`：独立 favicon 注入测试未失败，但完整套件中的 `2` 条旧静态资源断言请求不存在的 `/logo.png`，回退到 HTML 后导致断言失败。
  - `go test -tags embed ./internal/web -run '^TestInjectSiteFavicon$' -count=1 -v`：`5` 个 favicon 子测试全部通过。
- 镜像或部署验证：未执行。本次只完成本地上游合入和代码验证，ACR `latest` 仍是此前发布的 `0.1.171`，需要单独构建并推送后才包含 `0.1.172`。
- 合入总结：
  - 本次同步加强了 OAuth 安全、OpenAI/Codex 路由与流式恢复、计费精度、订阅额度重置和上游模型审计，并扩展 Gemini/Grok/复合模型支持。
  - `xingliux` 的独立 favicon 和生产部署配置均保留；发布前应构建新镜像，并在生产环境确认迁移 `194`、`195`、Usage 上游响应模型字段和长连接 failover 行为。

### 2026-08-04：同步 upstream/main 至 0.1.171

- 合入前定制分支提交：`49b3380fb`
- 上游共同基线提交：`7e2e9ba05`
- 本次合入的上游目标提交：`00b859617`
- 上游提交范围：`7e2e9ba05..00b859617`
- 上游最新提交日期：`2026-08-04T21:55:34+08:00`
- 上游提交数量：`51`
- 合入方式：`git merge --no-ff upstream/main`
- 合入后提交：`2ea4f870f608ad9b2139cda52abd160a159738d4`
- 关联上游 PR、Issue 或 Release：无（上游版本 `0.1.171`）
- 主要变更：
  - 新增腾讯天御和阿里云验证码 2.0 支持，并将验证码证明接入 OAuth 待确认注册流程。
  - 修复 Token 刷新轮换竞态、订阅并发续期、Stripe 退款幂等和退款余额强制确认等稳定性与资金安全问题。
  - 完善 OpenAI/Codex 出站身份、客户端版本同步和容量保护；Codex 版本同步主路径改用 `/releases/latest` 并保留回退路径。
  - 修复模型广场图片模型价格展示、Responses 审计文本解析、Messages 临时账号故障切换等问题。
  - 新增复合平台 reasoning effort 策略，并补充 OAuth、Passkey、设置契约和支付相关测试及云服务 SDK 依赖。
- 定制代码影响：
  - `site_favicon` 定制链路继续保留：设置常量、默认值、公开设置、管理端上传、SSR 注入、运行时 favicon 更新及图片 MIME 推断均未被覆盖。
  - Compose/ACR 定制、OpenResty 脚本及部署文档不在本次上游冲突范围内；上游新增设置字段需要随数据库设置接口一起部署。
- 冲突处理：
  - `backend/internal/service/setting_parse.go`：保留上游新增的腾讯云、阿里云验证码字段和 Codex 版本字段，同时保留定制字段 `SiteFavicon: settings[SettingKeySiteFavicon]`。
- 验证结果：
  - `git diff --check 49b3380fb 2ea4f870f`：通过。
  - `env -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u http_proxy -u https_proxy -u all_proxy go test ./...`：通过。
  - `pnpm typecheck`：通过。
  - `pnpm test:run`：`206` 个测试文件通过，`1` 个测试文件失败（`2` 个断言失败，另有 `10` 个未处理 mock 错误）。失败对应的回滚 API 旧断言和 `GroupsView` 旧 mock 在合入前已存在，未由本次冲突解决引入。
  - `pnpm build`：通过；仅有 Vite 分包体积和动态导入提示。
- 镜像或部署验证：未执行。本次只完成本地代码合入和验证，未重新构建或推送 ACR；生产环境现有 `latest` 镜像仍需后续单独构建发布后才包含本次上游代码。
- 合入总结：
  - 本次同步带来验证码供应商扩展、认证流程加固、Codex/OpenAI 兼容性和计费并发可靠性改进，同时保留 `xingliux` 的独立 favicon 定制。
  - 后续发布前应重新执行 Docker build/push，并在生产环境验证验证码配置、OAuth 注册、Codex 版本同步和长请求链路；前端全量单测中的既有失败项也应单独清理。

后续每次从 `upstream/main` 合入时，继续在本条记录上方追加新记录，最新记录优先。

### 记录模板

```markdown
### YYYY-MM-DD：同步 upstream/main

- 合入前定制分支提交：`<BASE_BEFORE>`
- 上游共同基线提交：`<UPSTREAM_BASE>`
- 本次合入的上游目标提交：`<UPSTREAM_TARGET>`
- 上游提交范围：`<UPSTREAM_BASE>..<UPSTREAM_TARGET>`
- 上游最新提交日期：`<UPSTREAM_DATE>`
- 合入方式：`merge --no-ff` / `<其他方式>`
- 合入后提交：`<BASE_AFTER>`
- 关联上游 PR、Issue 或 Release：`<链接或无>`
- 主要变更：
  - `<功能、修复或依赖变化>`
  - `<功能、修复或依赖变化>`
- 定制代码影响：
  - `<受影响的模块、接口、配置或部署行为>`
  - `<兼容性或迁移注意事项>`
- 冲突处理：`无` / `<冲突文件及处理决定>`
- 验证结果：
  - `<命令>`：`通过` / `失败` / `未执行（原因）`
  - `<命令>`：`通过` / `失败` / `未执行（原因）`
- 镜像或部署验证：`<结果；无则说明原因>`
- 合入总结：
  - `<本次合入带来的收益>`
  - `<遗留风险、后续动作或需要关注的行为>`
```

## 记录维护约定

- 每次合入只追加记录，不修改已完成记录的事实结果；发现错误时追加更正说明。
- 记录中的提交号使用完整 SHA 或至少 9 位短 SHA，确保可追溯。
- 测试和构建结果以实际执行输出为准，不以“应该通过”替代结果。
- 如一次同步被中止，不写入“合入完成”记录；可在模板中记录中止原因，待成功合入后再建立正式记录。
