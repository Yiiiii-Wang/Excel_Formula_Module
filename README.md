# Excel-style formula engine

TypeScript 实现的类 Excel 公式解析与求值模块。

## 需求边界（阶段 0 约定）

| 项目 | 约定 |
|------|------|
| 单元格引用 | 支持 `A1`、区域 `A1:B2`；跨表引用（如 `Sheet1!A1`）尚未实现。 |
| 公式前缀 | 与 Excel 一致：公式以 `=` 开头；词法阶段会去掉前导 `=`。 |
| 错误类型 | 结构化 `CellError`（`code`），可用 `formatErrorDisplay` 转为 `#DIV/0!`、`#CIRC!`（循环引用）等。 |

## 对外 API（阶段 5）

### `evaluate(formula, context?, options?)`

一步完成：去 `=`（在 tokenizer 内）、解析、求值。

- **`formula`**：以 `=` 开头的公式字符串。
- **`context`**（可选）：`EvaluateContext`，提供 `getCell` / `getRange`；可用 **`createMemoryContext(cells)`** 传入内存表。
- **`options?.functions`**（可选）：自定义 `FunctionRegistry`，默认内置函数表。

返回 **`EvaluateResult`**：

- **`{ ok: true, value }`**：求值成功；`value` 为 `FormulaValue`（含数字、文本、布尔、`null` 或 **Excel 风格错误** `CellError`）。
- **`{ ok: false, error: { kind, message } }`**：仅表示 **词法/解析失败**；`#DIV/0!` 等仍为 `ok: true` 下的 `value`。

```ts
import { evaluate, createMemoryContext } from "excel_formula_module";

const r = evaluate("=SUM(A1:A2)", createMemoryContext({ A1: 1, A2: 2 }));
if (r.ok) {
  console.log(r.value);
}
```

### `findFormulaCellsWithCircularReference(formulaKeys, inputs)`

在已知「哪些格是公式」及每个格的公式文本时，返回应视为 **循环引用** 的公式格地址集合（大写 A1）：含 Tarjan 找环 + 向依赖方传播。网页 Demo 重算前用其标记 `#CIRC!`。

### `extractDependencies(formula)`

供表格引擎做依赖分析：解析公式（失败则返回 **空数组**），收集 **所有引用的单元格**（**区域会展开**为矩形内全部 A1 地址），去重后 **按字典序排序** 返回。

```ts
extractDependencies("=A1+B1:C2"); // 例如 ["A1","B1","B2","C1","C2"]
```

### 底层接口

- **`evaluateFormula` / `evaluateExpr`**：已解析 AST 或字符串 + 可选 `FunctionRegistry` / `EvaluateContext`。
- **`parseFormula` / `tokenizeFormula`**：仅解析。

## 已支持函数（内置）

| 类别 | 函数 |
|------|------|
| 聚合 / 数学 | `SUM`, `MIN`, `MAX`, `ABS`, `INT`, `ROUND`, `MOD`, `SQRT` |
| 逻辑 | `IF`, `AND`, `OR`, `NOT` |
| 文本 | `LEN`, `LEFT`, `MID`, `CONCAT` |

字面量 **`TRUE` / `FALSE`** 按 Excel 关键字解析为布尔，不作为单元格地址。

## 与 Excel 的差异（已知）

- **跨表引用**（`Sheet1!A1`）、**三维引用**、**结构化引用**等未实现。
- **数组公式 / 动态溢出**未实现；单独使用区域引用作标量时多为 `#VALUE!`。
- **日期/时间**、**格式**、**区域交集 / 联合运算符**（空格、`,`）未实现。
- **部分函数语义**（如 `ROUND` 银行家舍入、`MOD` 负数边界）与 Excel 可能存在细微差别；以本仓库单测为准。

## Demo（命令行）

先编译再运行示例脚本（展示 `evaluate`、内存上下文、`extractDependencies`）：

```bash
npm run demo
```

等价于 `npm run build && node examples/demo.mjs`。也可在已有 `dist/` 时直接执行 `node examples/demo.mjs`。

## Demo（网页 UI）

简易表格界面（A1–F8）：输入常数或 `=` 公式，点「全部计算」在格子下方显示结果；「填入示例」可一键加载示例数据。

```bash
npm run demo:web
```

浏览器访问终端提示的本地地址（默认 `http://localhost:5173`）。静态构建输出在 `examples/web/dist/`：

```bash
npm run demo:web:build
```

网页源码在 `examples/web/`，开发时直接 `import` 仓库内 `src/` 引擎代码（由 Vite 打包）。

## 版本与变更

- 版本号遵循 **语义化版本**（SemVer：`MAJOR.MINOR.PATCH`）。
- 变更记录见根目录 **`CHANGELOG.md`**（发版时把 `[Unreleased]` 下沉到新版本）。

## API 文档（TypeDoc）

从入口 `src/index.ts` 生成静态 HTML（默认输出到 `docs/api/`，已加入 `.gitignore`，需本地生成）：

```bash
npm run docs
```

生成后在浏览器打开 `docs/api/index.html`。CI 中会执行 `npm run docs` 以确认文档能成功构建。

## 持续集成（CI）

推送或 PR 到 `main` / `master` 时，GitHub Actions 会依次执行：**Biome** → **typecheck** → **带覆盖率门槛的测试** → **库 build** → **TypeDoc** → **网页 demo build**。

## 脚本

- `npm run demo` — 构建并运行 `examples/demo.mjs`
- `npm run demo:web` — 启动网页 Demo（Vite dev）
- `npm run demo:web:build` — 构建网页 Demo 到 `examples/web/dist/`
- `npm run lint` — Biome 检查（格式 + lint）
- `npm run format` — Biome 自动格式化
- `npm run typecheck` — 全量类型检查（含测试与 Vitest 配置）
- `npm run build` — 编译 `src`（不含 `*.test.ts`）到 `dist/`
- `npm test` — 运行单元测试
- `npm run test:coverage` — 测试 + 覆盖率门槛（`src/`，排除 `index.ts` 与 `*.test.ts`）
- `npm run test:watch` — 监听模式跑测试
- `npm run docs` — 生成 TypeDoc 到 `docs/api/`

## 开发

Node.js 建议使用当前 LTS；依赖安装：`npm install`。
