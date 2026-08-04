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

当前没有已完成的上游合入记录。下一次从 `upstream/main` 合入后，追加在本节顶部，最新记录优先。

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
