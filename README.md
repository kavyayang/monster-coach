# 🏋️ 怪兽运动搭子 — AI 智能体能教练

基于 React + TypeScript 的赛博朋克风格智能健身仪表盘，集成 3D 虚拟教练、实时生物数据监控、AI 语音反馈、可穿戴设备数据同步与游戏化粒子动效。

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 19 + TypeScript 6 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 3（赛博朋克自定义主题） |
| 3D 渲染 | Spline（`@splinetool/react-spline` + `@splinetool/runtime`） |
| 粒子特效 | `canvas-confetti` |
| 后端通信 | HTTP 轮询（FastAPI `127.0.0.1:8000`） |
| 字体 | JetBrains Mono + Inter |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

开发服务器默认运行在 `http://localhost:5173`。

## 项目结构

```
src/
├── components/           # UI 组件
│   ├── Dashboard.tsx     # 根布局组件（左右分栏 + 状态管理）
│   ├── LeftPanel.tsx     # 左侧面板：AI 教练消息 + 3D 怪兽模型 + 嘴部动画
│   ├── RightPanel.tsx    # 右侧面板：状态栏 + 视频流区域 + 结束训练按钮
│   ├── StatsRow.tsx      # 顶部控制栏：背景音乐 + AI 定制计划 + 数据卡片
│   ├── CustomPlanModal.tsx      # AI 定制计划弹窗（HealthKit 同步模拟）
│   ├── WorkoutSummaryModal.tsx  # 训练总结报告弹窗（多维数据 + AI 复盘）
│   ├── ProgressRing.tsx  # 环形进度条（分数展示）
│   └── HeartIcon.tsx     # 心率图标
├── data/
│   ├── monsters.ts       # 11 个 Spline 3D 怪兽模型定义 + 强度计算
│   └── mockData.ts       # 初始模拟数据
├── services/
│   ├── api.ts            # 后端 API 调用封装
│   ├── types.ts          # 后端数据接口类型定义
│   └── usePipeline.ts    # 核心数据管道 Hook（轮询 + 模拟回退）
├── types/
│   └── dashboard.ts      # 前端全局类型定义
├── utils/
│   ├── coachVoice.ts     # AI 教练文案矩阵（4 种性格 × 4 心率区 × 3 分数档）
│   └── confettiEffects.ts # 游戏化粒子动效（高分/低分/训练完成）
├── App.tsx               # 应用入口
├── main.tsx              # React 挂载点
└── index.css             # 全局样式（扫描线、发光、动画）
```

## 核心功能

### 🎭 3D 虚拟教练
- 11 个 Spline 3D 怪兽模型，根据训练强度自动切换
- 代码驱动嘴部动画（唇齿同步），通过 `@splinetool/runtime` API 实时控制 Mouth 图层 Scale
- 支持自动/手动模式切换，带滞回防抖

### 🧠 多性格 AI 教练
- 4 种性格：🌸 温柔 / 🫡 严厉 / 💀 毒舌 / ⚡ 元气
- 4 种音色：温柔女声 / 元气男声 / 严厉男声 / 热血动漫
- 100+ 条差异化文案，根据心率区间、动作分数、性格类型实时匹配

### 📊 实时数据监控
- 心率、动作、次数、分数四维数据卡片
- 心率超阈值红色警报 + 动作变形警告
- 后端 HTTP 轮询（600ms），自动回退至本地模拟
- 连接状态指示灯（LIVE / CONNECTING / OFFLINE）

### ⌚ AI 定制计划
- 模拟 Apple HealthKit 数据同步动画
- 睡眠、静息心率、HRV、恢复指数评估
- AI 根据身体状态生成个性化恢复训练计划

### 🎉 游戏化特效
- `score > 85`：🌸 鲜花 + ⭐ 星星 + 👏 鼓掌，从底部喷射
- `score < 60`：🔥 火焰 + 💢 愤怒，从顶部下坠
- 训练完成：🏆 奖杯 + 🥇 金牌 + 🎉🎊 五彩纸带全屏大爆发

### 📝 训练总结报告
- 训练时长、动作名称、总计次数、平均分、峰值心率
- AI 教练根据性格 + 成绩生成个性化复盘寄语
- 支持"保存并同步到 Apple Health"模拟操作

### 🎵 背景音乐
- 预设音轨：赛博电音 / 热血燃曲 / 禅意拉伸

## 后端接口

项目预期对接 FastAPI 后端（`http://127.0.0.1:8000`）：

| 端点 | 方法 | 说明 |
|---|---|---|
| `/health` | GET | 健康检查 |
| `/pipeline/analyze` | POST | 姿态分析 + 心率安全 + 次数统计 |
| `/llm/realtime-coach` | POST | AI 教练实时语音文案生成 |

后端不可用时自动降级为本地模拟数据。
