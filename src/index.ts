export type {
  EvaluateApiOptions,
  EvaluateFailureKind,
  EvaluateResult,
} from "./api.js";
export { evaluate } from "./api.js";
export type {
  BinaryOpExpr,
  BinaryOperator,
  BooleanLiteralExpr,
  CallExpr,
  CellRefExpr,
  Expr,
  NumberLiteralExpr,
  RangeRefExpr,
  StringLiteralExpr,
  UnaryOpExpr,
  UnaryOperator,
} from "./ast.js";
export { ast, countExprNodes } from "./ast.js";
export type { EvaluateContext } from "./context-memory.js";
export { createMemoryContext } from "./context-memory.js";
export { extractDependencies } from "./dependencies.js";
export type { EvaluateOptions } from "./evaluate.js";
export { evaluateExpr, evaluateFormula } from "./evaluate.js";
export type { Token, TokenKind } from "./lexer.js";
export { LexError, tokenizeFormula } from "./lexer.js";
export { ParseError, parseFormula } from "./parser.js";
export type { FormulaFunction } from "./registry.js";
export {
  builtinMax,
  builtinMin,
  builtinSum,
  createDefaultRegistry,
  FunctionRegistry,
} from "./registry.js";
export type {
  CellError,
  ExcelErrorCode,
  FormulaScalar,
  FormulaValue,
} from "./value.js";
export {
  cellError,
  formatErrorDisplay,
  isCellError,
} from "./value.js";
