# 掌中工具箱 Palm Toolbox

跨平台（iOS / Android）效率工具集 App。基于 **Expo + React Native + TypeScript** 开发，一套代码同时构建双端应用。

当前版本已实现 **房贷计算器（提前还款测算）** 与 **存款计算器（定期单利测算）**，其余 7 个工具已完成 UI 入口与图标，将按路线图陆续上线。

## 功能总览

| 模块 | 状态 | 说明 |
| --- | --- | --- |
| 房贷计算器 | ✅ 已上线 | 等额本息 + 提前还款测算（减少月供 / 缩短期限双模式） |
| 还款计划 | ✅ 已上线 | 对比统计、逐期明细表、全部期数展开、CSV 导出 |
| 存款计算器 | ✅ 已上线 | 定期整存整取单利测算、到期日与计息天数、常用利率预设 |
| 统计 | ✅ 已上线 | 计算汇总、最近一次测算、前 12 期本金/利息构成图 |
| 我的 | ✅ 已上线 | 账号卡片、设置项（提醒开关 / 缓存 / 关于） |
| 全部工具 | ✅ 已上线 | 9 个工具清单与上线状态 |
| 个税计算 / 汇率换算 / 单位换算 / 记账本 / 待办清单 / 番茄钟 / 日历提醒 | 🔜 开发中 | UI 入口已就绪，点击提示「即将上线」 |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器（ Expo Go 扫码预览，或按 a / i 打开模拟器）
npm start

# 类型检查
npm run typecheck

# 单元测试（房贷 + 存款计算引擎，共 27 个用例）
npm test
```

- **iOS**：`npm run ios`（需要 macOS + Xcode）
- **Android**：`npm run android`（需要 Android Studio + 模拟器）
- 无 Mac / 无模拟器时，可用手机安装 **Expo Go**，扫描终端二维码直接预览。

### 构建 Android 测试 APK

无需发布到应用市场。首次构建需要 Expo 账号并将项目关联到 EAS；构建在 EAS 云端执行，不要求本机安装 Android Studio：

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npm run build:android:preview
```

构建完成后，从终端输出或 Expo 构建页面下载 APK，在 Android 手机上打开安装；也可以连接已开启 USB 调试的手机，用 `adb install <APK路径>` 安装。首次安装时，Android 可能会要求允许该来源安装应用。

## 项目结构

```
palm-toolbox/
├── App.tsx                        # 根组件（Provider 组装）
├── app.json                       # Expo 配置（应用名 / 包名 / 图标）
├── src/
│   ├── theme/theme.ts             # 设计规范（色彩 / 间距 / 圆角 / 字号 / 图标 Tile 配色）
│   ├── types/index.ts             # 全局类型（Tool / MortgageInput / MortgageResult…）
│   ├── data/tools.ts              # 9 个工具清单 + 利率/期数预设
│   ├── utils/
│   │   ├── mortgage.ts            # 房贷计算引擎（等额本息 + 提前还款）
│   │   ├── deposit.ts             # 存款计算引擎（定期单利 + 到期日推算）
│   │   ├── format.ts              # 金额千分位 / 年月标签等格式化
│   │   ├── mortgage.test.ts       # 房贷计算引擎单元测试
│   │   └── deposit.test.ts        # 存款计算引擎单元测试
│   ├── context/CalculationContext.tsx   # 计算记录（统计页数据源）
│   ├── components/
│   │   ├── Toast.tsx              # 全局轻提示
│   │   ├── PrimaryButton.tsx      # 主操作按钮
│   │   ├── ToolCard.tsx           # 首页工具卡片
│   │   ├── StatCard.tsx           # 还款计划统计卡
│   │   ├── AmortizationTable.tsx  # 还款明细表
│   │   ├── StackedBarChart.tsx    # 本金/利息堆叠柱状图
│   │   ├── PickerModal.tsx        # 底部弹窗容器
│   │   ├── MonthPickerModal.tsx   # 年/月/日选择器（还款日 / 存款日共用）
│   │   ├── RatePickerModal.tsx    # 贷款年利率选择器（预设 + 自定义）
│   │   ├── DepositRateModal.tsx   # 存款利率选择器（挂牌利率 + 自定义）
│   │   ├── PeriodPickerModal.tsx  # 剩余期数选择器
│   │   ├── InfoModal.tsx          # 计算说明弹窗
│   │   └── icons/
│   │       ├── ToolIcons.tsx      # 9 个工具 SVG 图标 + 渐变金额文字
│   │       └── UIIcons.tsx        # 返回 / 信息 / Tab 等通用图标
│   ├── navigation/
│   │   ├── AppNavigator.tsx       # Stack + BottomTabs 导航
│   │   ├── CustomTabBar.tsx       # 自定义底部 Tab Bar
│   │   └── types.ts               # 导航参数类型
│   └── screens/
│       ├── HomeScreen.tsx             # 首页（工具箱 3×3 网格）
│       ├── MortgageCalculatorScreen.tsx  # 房贷计算器输入页
│       ├── RepaymentPlanScreen.tsx       # 还款计划结果页
│       ├── DepositCalculatorScreen.tsx   # 存款计算器（输入 + 实时测算）
│       ├── StatisticsScreen.tsx          # 统计页
│       ├── ProfileScreen.tsx             # 我的
│       └── AllToolsScreen.tsx            # 全部工具
└── docs/跨平台方案设计.md          # 跨平台技术方案文档
```

## 房贷计算器说明

**计算模型**：等额本息

```
月供 M = P × r × (1+r)^n / [(1+r)^n − 1]     r = 年利率/12，n = 期数
```

**提前还款两种模式**：

| 模式 | 规则 | 适用场景 |
| --- | --- | --- |
| 减少月供 | 期限不变，按剩余本金重算月供 | 降低每月压力 |
| 缩短期限 | 月供不变，反解新的期数 | 节省利息最大化 |

**边界处理**：全额还清（无后续月供，节省全部剩余利息）、零利率、输入校验（金额必须为正且提前还款额 < 剩余本金）、末期尾差自动吸收、金额展示四舍五入到元。

**导出**：还款计划支持导出 CSV（期数 / 月供总额 / 月供本金 / 月供利息 / 剩余总额），通过系统分享面板发送。

## 存款计算器说明

**计算模型**：定期存款（整存整取）单利

```
利息 = 本金 × 年利率 × 存款年数 + 本金 × 日利率 × 零头天数
日利率 = 年利率 ÷ 360        零头天数 = 月 × 30 + 天
```

**到期日**：按开户日「对年对月对日」推算，月末不足时取当月最后一天（如 1 月 31 日存 1 个月 → 2 月 28/29 日）。到期日与计息天数（实际日历天数）随结果一同展示。

**交互**：本金、期限（年 / 月 / 天）、存款日期、利率改动即时重算，无需点击；「常用利率」提供常见挂牌利率预设，也可手动输入实际执行利率。存期内遇利率调整，仍按开户日利率执行。

## 设计规范速览

- 主色：深 Teal `#0D4A3D`（按钮 / 表头 / Tab 激活态）
- 金额强调：蓝紫渐变 `#3E63F2 → #8A5CF6`（节省利息）
- 背景：浅 Lavender 灰 `#F4F6FA`；卡片纯白 + 大圆角（16–24pt）
- 图标：全部为 SVG 矢量组件（`react-native-svg`），无位图资源依赖
- 底部 Tab：首页 / 统计 / 我的

完整技术选型、架构分层、路线图与发布策略见 [docs/跨平台方案设计.md](./docs/跨平台方案设计.md)。

## 环境要求

- Node.js ≥ 18（开发机验证版本：22.22.2）
- Expo SDK 58 / React Native 0.88 / React 19.3
- iOS 15.1+ / Android 8.0+（Expo SDK 58 基线）
