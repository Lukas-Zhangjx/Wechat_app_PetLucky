# 爪爪运 · 项目规范

## 项目信息
- **产品名称**：爪爪运（宠物玄学算命微信小程序）
- **框架**：原生微信小程序，JavaScript ES6+，不使用 TypeScript / uni-app / Taro
- **样式**：WXSS + CSS 变量，不引入第三方 UI 框架
- **AI 调用**：通过微信云函数 `aiProxy` 中转，前端绝不持有 API Key
- **后端**：微信云开发（CloudBase），无独立服务器
- **数据存储**：云数据库（`user_usage`、`fortune_records`）+ 本地 `wx.storage` 缓存

## 目录结构
```
PetLucky/
├── project.config.json          # 项目配置（根目录，开发者工具打开此层）
├── CLAUDE.md
├── 产品说明文档.md
│
├── miniprogram/                 # 前端小程序
│   ├── app.js / app.json / app.wxss
│   ├── pages/
│   │   ├── index/               # 首页
│   │   ├── select-pet/          # 选择宠物类型
│   │   ├── upload-photo/        # 上传照片 + 表单
│   │   ├── result/              # 算命结果
│   │   ├── fortune-sign/        # 今日灵签
│   │   └── my/                  # 我的（历史记录）
│   ├── components/
│   │   ├── loading-crystal/     # 道家黄纸加载动画
│   │   └── star-rating/         # 星级运势展示
│   └── utils/
│       ├── api.js               # wx.cloud.callFunction 封装
│       ├── fortune.js           # 灵签数据 + 宠物类型定义
│       ├── prompts.js           # 客户端加载文案
│       └── storage.js           # wx.storage 封装
│
└── cloudfunctions/
    └── aiProxy/                 # 云函数：AI 调用 + 次数限制 + 数据库读写
        ├── index.js
        ├── package.json
        └── utils/prompts.js     # 喵仙道人 System/User Prompt
```

## 分层规则（硬性约束）
- **pages 层**：只做 UI 渲染和事件响应，不写业务逻辑
- **禁止**在 pages 层直接调用 `wx.setStorageSync`、`wx.getStorageSync`
- 所有存储操作 → `utils/storage.js`
- 所有 AI / 云数据库操作 → `utils/api.js` → 云函数 `aiProxy`
- **utils 层**：纯函数，无副作用，不调用微信 API（storage.js 除外）
- **cloudfunctions 层**：唯一可持有 `QWEN_API_KEY` 的位置

## 命名规范
- 目录：kebab-case（`loading-crystal/`）
- JS 变量/函数：camelCase，函数以动词开头（`callFortune`、`getTodaySign`）
- 常量：UPPER_SNAKE_CASE（`FREE_LIMIT`、`MAX_RECORDS`）
- 布尔变量：`is/has/can` 前缀
- CSS 类名：BEM（`talisman-paper__char--filled`）
- 禁止无意义缩写（`d`、`tmp`、`cb`）

## JS 规范
- 禁止 `var`，用 `const`/`let`
- 异步操作用 `async/await`，禁止回调嵌套超过 2 层
- 裸 Promise 必须有 `.catch()`，或改用 `async/await` + `try/catch`
- 函数不超过 40 行，文件不超过 300 行，超出则拆分
- 所有 `wx.getStorageSync` 调用必须有 `try/catch` 和 fallback 默认值
- 所有 `wx.setStorageSync` 调用必须有 `try/catch`

## WXML 规范
- 超过 2 个属性时每个属性单独一行
- `wx:for` 必须加 `wx:key`
- 禁止模板内写复杂逻辑，提取到 js 后绑定计算字段

## WXSS 规范
- 尺寸单位全部用 `rpx`，禁止 `px`
- 颜色全部用 CSS 变量，禁止硬编码色值
- CSS 变量统一定义在 `app.wxss` 的 `page {}` 选择器内

## 注释规范（强制执行）
- **所有函数必须有注释**，公共函数用 JSDoc（`@param`、`@returns`），私有函数用单行说明
- **每个文件顶部**必须有文件用途说明注释
- **每个逻辑块**（if 分支、循环、关键赋值）必须有行内注释说明意图
- **WXML 模板**中每个主要区块（banner、卡片、列表等）用 `<!-- 区块名 -->` 标注
- **云函数每个 handler** 必须注释入参格式和返回格式
- 禁止无意义注释（`// 设置值`、`// 调用函数`）
- `TODO`/`FIXME` 必须说明原因和预期处理方式

---

## Git 工作流（强制执行）

### 分支规则

**任何功能开发或 Bug 修复，都必须新建分支，禁止直接在 `main` 上提交。**

```
main                  ← 稳定版本，只接受合并，不直接 commit
  └── develop         ← 日常集成分支（可选，小团队可直接从 main 切）
        ├── feature/xxx    ← 新功能
        ├── fix/xxx        ← Bug 修复
        └── refactor/xxx   ← 重构
```

### 标准流程

**开发新功能：**
```bash
git checkout main && git pull          # 从最新 main 切出
git checkout -b feature/功能名         # 新建功能分支
# ... 开发、提交 ...
git checkout main
git merge feature/功能名 --no-ff       # 合并回 main（保留分支记录）
git branch -d feature/功能名           # 删除已合并分支
git push
```

**修复 Bug：**
```bash
git checkout main && git pull
git checkout -b fix/问题描述
# ... 修复、提交 ...
git checkout main
git merge fix/问题描述 --no-ff
git branch -d fix/问题描述
git push
```

### Commit Message 格式（Conventional Commits）

```
<type>(<scope>): <subject>
```

**type：**
- `feat` 新功能
- `fix` Bug 修复
- `refactor` 重构（不改功能）
- `style` 样式调整
- `docs` 文档更新
- `chore` 构建/依赖/配置
- `perf` 性能优化

**scope（爪爪运专用）：**
`ai` / `cloud` / `upload` / `result` / `fortune-sign` / `my` / `index` / `ui` / `prompt`

**合格示例：**
```
feat(upload): 添加图片压缩逻辑，限制最长边 800px
fix(result): 修复 SSR 稀有度标签颜色在深色背景下不可见的问题
refactor(cloud): 将次数检查与 AI 调用合并为单次云函数调用
style(loading): 将水晶球动画替换为道家黄纸符咒风格
feat(prompt): 新增喵仙道人对柴犬品种的差异化毒舌描述
```

**禁止：**
- `fix bug`
- `update code`
- `WIP`
- 一个 commit 包含多个不相关改动

### 提交前 Checklist
- [ ] 无 `console.log`（`console.error` 保留）
- [ ] 无硬编码 API Key 或敏感信息
- [ ] 新函数有 JSDoc
- [ ] 在功能分支上，而非 `main`
- [ ] commit message 符合 Conventional Commits 格式

---

## 禁止事项一览
| 禁止 | 原因 |
|------|------|
| 直接 commit 到 `main` | 污染稳定版本，无法回滚单个功能 |
| 功能未完成就合并 | 破坏 main 可用性 |
| page 层直接操作 storage | key 散落，难以维护 |
| 前端代码中出现 `QWEN_API_KEY` | 严重安全风险，key 会泄露到客户端 |
| `var` | 作用域问题 |
| 裸 Promise 无错误处理 | 静默失败，用户看不到错误 |
| 魔法数字/字符串（如直接写 `5`） | 提取至常量，集中管理 |
| rpx 以外的尺寸单位 | 多机型适配问题 |
| 硬编码色值（如 `#F5A623`） | 应使用 CSS 变量 `var(--color-primary)` |
