export type {
  BinaryOperator,
  BinaryOpExpr,
  BooleanLiteralExpr,
  CallExpr,
  CellRefExpr,
  Expr,
  NumberLiteralExpr,
  RangeRefExpr,
  StringLiteralExpr,
  UnaryOperator,
  UnaryOpExpr,
} from "./ast.js";
export { ast, countExprNodes } from "./ast.js";
export type { Token, TokenKind } from "./lexer.js";
export { LexError, tokenizeFormula } from "./lexer.js";
export { ParseError, parseFormula } from "./parser.js";
export type { EvaluateContext } from "./context-memory.js";
export { createMemoryContext } from "./context-memory.js";
export type {
  EvaluateApiOptions,
  EvaluateFailureKind,
  EvaluateResult,
} from "./api.js";
export { evaluate } from "./api.js";
export { extractDependencies } from "./dependencies.js";
export type { EvaluateOptions } from "./evaluate.js";
export { evaluateExpr, evaluateFormula } from "./evaluate.js";
export type { FormulaFunction } from "./registry.js";
export {
  FunctionRegistry,
  builtinMax,
  builtinMin,
  builtinSum,
  createDefaultRegistry,
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
