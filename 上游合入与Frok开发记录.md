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
