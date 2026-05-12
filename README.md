# VibeGuard

**AI 代码生成的"语义安检门"**

> 你是否曾因为信任 AI 而直接合入了带有虚构 API 的代码？
> 你是否曾在 commit 里意外夹带了测试用的 Secret？
> **VibeGuard 在你按下 commit 键的一瞬，自动为你守住代码底线。**

## 核心特性

- **拦截幻觉** — 自动识别 AI 编造的函数、虚假 API 和逻辑矛盾
- **泄漏防护** — 语义识别硬编码的 API Key、Token 和敏感信息
- **零配置启动** — `npm install -g vibeguard && vibeguard init`
- **100% 本地隐私** — 完美适配 Ollama，让代码审计不出本地

## 工作原理

```
git commit → VibeGuard 提取 diff → AI 语义扫描 → 发现风险 → 拦截提交
```

VibeGuard 不查语法（那是 ESLint 的事），它只查"语义对不对"。它通过 Git Hook 介入你的开发流程，在 `git commit` 时自动扫描暂存区变更，利用 LLM（云端或本地 Ollama）进行语义分析，发现高危幻觉或安全风险时强制拦截 commit。

## 快速开始

### 安装

```bash
npm install -g vibeguard
```

### 初始化项目

```bash
cd your-project
vibeguard init
```

这会在你的项目中安装 pre-commit hook，之后每次 `git commit` 都会自动扫描。

### 手动扫描

```bash
vibeguard scan
```

### 跳过扫描

```bash
git commit --no-verify -m "skip vibeguard"
```

## 配置

在项目根目录创建 `.vibeguard.yaml`：

```yaml
model:
  # 选择 AI 提供商: openai | ollama
  provider: ollama

  ollama:
    model: llama3
    baseUrl: http://localhost:11434

  openai:
    model: gpt-4o-mini
  # API Key 通过环境变量 OPENAI_API_KEY 设置

scan:
  maxDiffChars: 12000   # 最大扫描字符数
  hallucinationDetection: true
  securityScan: true
  timeout: 30           # 超时时间(秒)

rules:
  bannedImports:
    - lodash.get
    - request
  bannedPatterns:
    - "eval("
    - "new Function("
  ignorePaths:
    - "dist/**"
    - "*.min.js"
```

### 使用本地模型 (推荐)

1. 安装 [Ollama](https://ollama.ai)
2. 拉取模型: `ollama pull llama3`
3. 在 `.vibeguard.yaml` 中设置 `provider: ollama`

## 检测能力

### 幻觉检测

- 虚假 API 调用（如 `requests.get_with_auto_retry()`）
- 虚构的库引用（不存在的 npm 包或模块）
- 逻辑矛盾与类型不匹配
- 未实现的占位代码
- 架构禁令违规

### 安全扫描

- 硬编码密钥（API Key、Token、密码）
- 注入风险（SQL 注入、命令注入、XSS）
- 不安全的加密算法（MD5、SHA1）
- 危险函数调用（eval、new Function）
- 敏感信息泄露

## CLI 命令

| 命令 | 说明 |
|------|------|
| `vibeguard scan` | 扫描暂存区变更 |
| `vibeguard init` | 安装 pre-commit hook |
| `vibeguard uninstall` | 卸载 pre-commit hook |
| `vibeguard config` | 显示当前生效配置 |
| `vibeguard --help` | 查看帮助 |

## 工程架构

```
vibeguard/
├── src/
│   ├── cli.ts            # CLI 入口
│   ├── core/
│   │   ├── audit.ts      # 扫描调度器
│   │   ├── analyzer.ts   # AI 分析与结果解析
│   │   ├── config.ts     # 配置加载
│   │   └── git.ts        # Git diff 提取与 Hook 管理
│   ├── connectors/
│   │   ├── openai.ts     # OpenAI 适配器
│   │   └── ollama.ts     # Ollama 适配器
│   └── rules/
│       ├── index.ts      # Prompt 构建器
│       ├── hallucination.ts  # 幻觉检测 Prompt
│       └── security.ts       # 安全扫描 Prompt
├── tests/
├── .vibeguard.yaml       # 默认规则配置
├── package.json
└── README.md
```

## 风险与规避

| 风险 | 规避方案 |
|------|----------|
| 语义分析误伤正常代码 | 支持 `--no-verify` 跳过，本地白名单配置 |
| LLM 调用延迟 | 只扫描 diff 变更行及上下文，非全文件扫描 |
| 云端 API 成本 | 默认适配 Ollama 本地模型，零成本审计 |

## 开发

```bash
# 克隆项目
git clone https://github.com/your-org/vibeguard.git
cd vibeguard

# 安装依赖
npm install

# 开发模式 (监听编译)
npm run dev

# 运行测试
npm test

# 构建
npm run build
```

## 发布

发布通过 GitHub Actions 自动完成，只需两步：

1. 在 GitHub 仓库 Settings → Secrets 中添加 `NPM_TOKEN`（npm Access Token）
2. 在 GitHub 创建 Release，填写 tag（如 `v0.1.0`）并发布

Actions 会自动完成：构建 → 测试 → 发布到 npm。

```bash
# 也可以通过 git tag 触发
git tag v0.1.0
git push origin v0.1.0
# 然后在 GitHub 上基于该 tag 创建 Release
```

## 路线图

- [x] CLI 核心与 Git diff 提取
- [x] OpenAI API 集成（含第三方兼容 API）
- [x] Ollama 本地模型支持
- [x] pre-commit hook 自动安装
- [x] 终端风险等级可视化
- [x] 大型 Diff 切片处理
- [x] NPM 发布（GitHub Actions 自动化）
- [ ] IDE 插件 (VS Code / Cursor)

## License

MIT
