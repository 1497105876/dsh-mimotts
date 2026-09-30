# @gw/dsh-mimotts — MiMo TTS 语音合成插件（DeepSeek Harness 0.2.0-rc.2）

把助手回复"读出来"的 DSH 插件：**设置页里的"语音合成"配置页** + **每条已定稿助手回复动作行里的音量按钮** + **带可拖动进度条的内联播放器**。语音由小米 MiMo TTS（`mimo-v2.5-tts`）合成，API Key 只存在于宿主侧，浏览器只发送文本、收到 WAV。

面向 **deepseek-harness `0.2.0-rc.2`**（`engines.dsh: ">=0.2.0-rc.2 <0.3.0"`），完全按照官方插件规范实现：

| 官方规范条目 | 本插件的落点 |
|---|---|
| [打包与安装插件](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/user/develop/basic/publish.zh.md)（bundle 组合包） | `package.json` 声明 `dsh.bundle.patch` + `cordis.patch.yml` 插入 `id: mimotts` 行；同包携带 `dsh.client` 浏览器半侧（裸包名行同时挂载 Host/Client 两侧） |
| [插件配置](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/user/develop/basic/config.zh.md)（无硬编码可调参数） | 全部参数走 Schemastery Config + `.volatile()`（接口地址/模型/音色/克隆样本/风格/字数/超时均可配）；密钥 `role('secret')` |
| [即时配置表单](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/cookbook/adding-a-settings-card.zh.md) | `ctx.configForms` + `SettingsFormModel` 标准表单；`ctx.settings.configure({ auto: false })` 关闭自动 Plugins 卡片，改为自己专属设置页 |
| [Web Client Slots](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/subsystems/slots.zh.md) | `conversation.chat.assistant-actions`（消息动作行）+ `settings.section`（设置页）两个 list 席位，`ctx.slots.inject` 贡献、effect 生命周期托管 |
| [Web Server 子系统](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/subsystems/web-server.zh.md) | `ctx.webServer.register` 挂 `/api/mimotts/status`、`/api/mimotts/synthesize` 两条路由，入口先过 `ctx.connection.requestRejection` 信任栅栏（Host/Origin + 浏览器鉴权），LAN 裸请求无法白嫖 API 额度 |
| [客户端模块系统](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/client/modules/README.zh.md) | `lib/client.js` 为 lazy-CJS factory（`window.__ModuleLoader__.load({ id, factory })`），外部仅平台模块（react / cordis / client-store / ui-primitives），跨插件只经 Cordis 服务与 `import type`（构建期 purity gate 强制） |
| [extension-cookbook · UI 插件](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/docs/cookbook/extension-cookbook.zh.md) | 业务数据不进组件 props 面：文本经 `useChat` 从 Conversation binding 派生，配置经 `configForms`，合成经宿主路由，文案经 `ctx.locale`（zh/en 双语） |

## 功能

1. **设置 → 语音合成（专属设置页）**
   - API Key（只写密钥，绝不回传页面；显示"已配置/未配置"）
   - 接口地址（默认 `https://api.xiaomimimo.com/v1`）、模型（默认 `mimo-v2.5-tts`）
   - 预置音色（默认 `mimo_default`）/ 音色克隆样本（宿主本地 WAV 路径，24kHz/16bit/单声道，5–15s）
   - 默认风格（如"开心""语速慢""东北话"）、单次最大字符数、请求超时
   - **试听**：用当前页面（含未保存修改）的风格/音色合成一句示例，内联播放
   - 标准表单行为：脏值预览、"已覆盖/恢复默认"徽标、保存/放弃、只读部署提示
2. **每条已定稿助手回复底部的音量按钮**（位于该消息动作行，复制/分支之间）
   - 点击 → 宿主合成（Markdown 归一化：不朗读代码块/URL/标记符号）→ 自动播放
   - 播放器浮层：**播放/暂停 + 可拖动进度条（pointer 拖拽、单击定位、键盘 ←→/Home/End）** + 时间读数
   - 同时只有一条在播；播放中动作行不再悬停淡出
   - 失败就地提示（未配置/超时/上游拒绝/无文本等稳定错误码 → 本地化文案）
3. **安全边界**：密钥只在宿主；`/api/mimotts/*` 两路由先过 Connection 信任栅栏；请求体 1MiB 上限；文本超预算在句末截断朗读开头。

## 目录

```
dsh-mimotts/
├── package.json            # dsh.bundle + dsh.client manifest，engines.dsh 锁 0.2.0
├── cordis.patch.yml        # bundle 层：插入 id: mimotts 行（两侧共用）
├── tsconfig.json           # tsc → lib/node（Node 半侧 + 类型）
├── tsdown.config.ts        # 官方 clientBundle 的树外复刻 → lib/client.js
├── icon.svg  locale/{zh,en}.json
├── src/
│   ├── index.ts            # Host 插件：Config schema + 两条 Web 路由
│   ├── tts.ts              # MiMo TTS 客户端（/chat/completions + audio 输出块）
│   ├── wav.ts  normalize.ts# PCM→WAV 封装；Markdown→可朗读文本
│   ├── settings.ts         # 两侧共享：命名空间/路由/默认值/线格式类型
│   └── client/
│       ├── index.ts        # 浏览器插件：两个 slot 席位注册
│       ├── SpeakAction.tsx # 消息动作行的音量按钮 + 浮层播放器
│       ├── PlayerBar.tsx   # 可拖动进度条（role=slider，指针+键盘）
│       ├── SettingsSection.tsx + settings-controller.ts  # 设置页
│       ├── chat-text.ts    # 从 Chat snapshot 取该消息的可朗读文本
│       ├── use-audio-player.ts  # 播放引擎（单活播放器）
│       ├── api.ts  status.ts  slots.ts  locales.ts  styles.ts  SpeakerIcon.tsx
├── tests/                  # 19 项单测（node --test）
└── scripts/
    ├── stub-e2e.mjs        # 本地桩服务端到端（无需真实密钥）
    └── live-e2e.mjs        # 真实 MiMo API 端到端（需 MIMO_API_KEY）
```

## 构建与安装

```sh
npm install          # 装依赖（无 prepare 钩子，需手动构建）
npm test             # 19 项单测
node scripts/stub-e2e.mjs
```

安装进 DSH profile（源码 checkout）：

```sh
dsh plugin --profile demo add ./dsh-mimotts
# pnpm≥10 首次 git/本地源码安装需要为构建授权：把 dsh-mimotts 写入
# 该 profile 的 pnpm-workspace.yaml → allowBuilds: { dsh-mimotts: true }，再重试
dsh --profile demo --dump-config   # 应能看到 "# == dsh-mimotts" 层
dsh --profile demo
```

打开 `http://127.0.0.1:3080`：**设置 → 语音合成** 填入 API Key（试听可即时验证），随后每条已定稿回复下都会出现音量按钮。

不想把密钥写进配置文件时，在 profile 的 `cordis.patch.yml` 里覆写该行：

```yaml
- id: mimotts
  config:
    apiKey: !!js process.env.MIMO_API_KEY
```

## 适配版本与「按版本选适配」

**分发不会按宿主版本自动下载对应适配版本。** 本插件打包时把 `@deepseek-ai/dsh-*` 依赖锁死在某一个 release（当前 0.2.0-rc.2），别人拉到的就是同一份 `package.json`；npm 不会"看对方 dsh 版本 → 选不同版本的 dsh-* 依赖"。真正的版本闸门是 dsh 的两处兼容性声明：

- `dsh.compatibility.dshReleases`：官方字段，精确列出本包适配的 release（如 `{ "0.2.0-rc.2": "compatible" }`）。安装器/市场在对方 dsh 版本不在白名单时**拒绝或警告**，而不是自动换一个适配版本。
- `engines.dsh`：npm 风格的范围闸门（当前 `>=0.2.0-rc.2 <0.3.0`），语义与上面互补。

运行时实际用的 `@deepseek-ai/dsh-*` 实例由**宿主 dsh 自带**（客户端半从平台模块表取 cordis/store/slots/primitives，Host 半由 Node 按宿主 `node_modules` 解析），插件代码只是复用宿主环境里的版本——只要代码用的 API 在该 dsh 版本里存在即可。想让 0.1.7 的 dsh 也能用，得单独发一份 pin 回 0.1.7-rc.2 的包（下方脚本一键生成），即"多版本并行发布"，用户按自己的 dsh 版本装对应那份。

本插件跟随 deepseek-harness 的 release，但 dsh 的包版本规则有两点容易踩坑：

1. **`@deepseek-ai/dsh-*` 整条线共用同一个 release 版本号**（0.2.0-rc.2 的所有 dsh-* 包都标 0.2.0-rc.2）。
2. **`@deepseek-ai/cordis` 与 `@deepseek-ai/schemastery` 是独立版本号，不跟随 release**（0.2.0-rc.2 时代仍是 cordis `~4.0.4`、schemastery `~3.18.4`），无脑把全部依赖改成同一个 release 会 404。
3. **`0.2.0-rc.2` 起 `dsh-scope` 成为 peer 依赖**：`dsh-session` / `dsh-api-remotes` 把 `@deepseek-ai/dsh-scope` 列为 peer，需与 cordis 一样同时写在 `peerDependencies` 与 `devDependencies` 里，否则 `npm install` 报 ERESOLVE。

要把插件重新对准另一个 dsh release，**不要手改版本号**，用脚本：

```sh
node scripts/pin-dsh-version.mjs <release>            # 改 package.json（dsh-* + engines.dsh）并打印后续步骤
node scripts/pin-dsh-version.mjs <release> --install  # 改完顺手跑 npm install
node scripts/pin-dsh-version.mjs <release> --self     # 顺便把插件自身 version 也改成 release
node scripts/pin-dsh-version.mjs <release> --dry-run  # 只预览不写文件
```

脚本会自动：把 `@deepseek-ai/dsh-*`（含 dsh-scope）在 `peer` / `dev` 两处改到目标 release；把 `engines.dsh` 推进到 `>=<release> <次版本+1>.0`；把 `dsh.compatibility.dshReleases` 同步写成 `{ "<release>": "compatible" }`；并去 npm 查该 release 配套的 `cordis` / `schemastery` 区间（也可用 `--cordis=...` / `--schemastery=...` 手动指定，跳过网络）。改完 `package.json` 后跑 `npm install` 让 `node_modules` / `package-lock.json` 跟上，再 `npm run build && npm test`。

## MiMo TTS 线格式（与 `mimo-tts-wav` skill 完全一致）

`POST {baseUrl}/chat/completions`，头 `api-key: <key>`，体：

```json
{
  "model": "mimo-v2.5-tts",
  "audio": { "format": "wav", "voice": "mimo_default" },
  "messages": [{ "role": "assistant", "content": "<style>开心</style>要说的话" }]
}
```

音色克隆时 `audio` 换成 `{ "format": "wav", "voice_audio": { "format": "wav", "data": "<base64 wav>" } }`；响应 `choices[0].message.audio.data` 为 base64 音频（RIFF 或裸 PCM，裸 PCM 由插件包成 24kHz/16bit/mono WAV）。

## 已知边界

- 按**消息**朗读：动作行属于该条已定稿回复，朗读其正文（不读思考块与工具调用）；代码块以"代码略"代替。
- 文本超过"单次最大字符数"时朗读开头并在句末截断（动作行旁有提示）。
- Desktop（Electron）走 IPC 桥接 fetch，路由路径不变。
- 语音输入（麦克风）是官方 `voice-input` 组合包的职责，与本插件互补不冲突。

## 验证记录

- `tsc` 全量类型检查通过（对着 0.2.0-rc.2 的真实 .d.ts）
- `node --test`：19/19 通过（请求形状/PCM 封装/Markdown 归一化/文本提取/错误码映射）
- `scripts/stub-e2e.mjs`：真实 HTTP 桩端到端通过（96,044 字节 WAV）
- MiMo 实机协议探测通过（与官方 `mimo-tts-wav` skill 同一契约，115,244 字节 WAV）；`scripts/live-e2e.mjs` 可对真实 API 跑完整引擎链路
