# Changelog

本项目的版本遵循[语义化版本](https://semver.org/lang/zh-CN/)（MAJOR.MINOR.PATCH）。

## [Unreleased]

- （开发中变更记在此处，发版时移到对应版本下）

## [1.0.0] — 2026-04-03

### Added

- 词法、解析（算术、比较、`&`、`^`、函数调用、`A1:B2` 区域、`TRUE`/`FALSE`）
- AST、`FormulaValue` / `CellError`、求值器与 `FunctionRegistry`、内置函数（SUM、IF、文本等）
- `evaluate` / `extractDependencies` 对外 API、`EvaluateContext` 与内存 mock
- CLI demo（`npm run demo`）、Vite 网页 demo（`npm run demo:web`）
- Vitest 单测与覆盖率门槛、Biome、GitHub Actions CI
- TypeDoc API 文档（`npm run docs`）
