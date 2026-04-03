# Excel-style formula engine

TypeScript 实现的类 Excel 公式解析与求值模块（进行中）。

## 需求边界（阶段 0 约定）

| 项目 | 约定 |
|------|------|
| 单元格引用 | 支持 `A1`、区域 `A1:B2`；跨表引用（如 `Sheet1!A1`）可在后续迭代加入。 |
| 公式前缀 | 与 Excel 一致：公式以 `=` 开头；解析前会去掉前导 `=`。 |
| 错误类型 | 与 Excel 对齐，使用 `#DIV/0!`、`#VALUE!` 等错误字符串或等价结构化表示。 |

## 脚本

- `npm run typecheck` — 全量类型检查（含测试与 Vitest 配置）
- `npm run build` — 编译 `src`（不含 `*.test.ts`）到 `dist/`
- `npm test` — 运行单元测试
- `npm run test:watch` — 监听模式跑测试

## 开发

Node.js 建议使用当前 LTS；依赖安装：`npm install`。
