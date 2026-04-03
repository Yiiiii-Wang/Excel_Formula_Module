import type {
  BinaryOperator,
  CellRefExpr,
  Expr,
  RangeRefExpr,
  UnaryOperator,
} from "./ast.js";
import type { EvaluateContext } from "./context-memory.js";
import { parseFormula } from "./parser.js";
import { createDefaultRegistry, type FunctionRegistry } from "./registry.js";
import {
  type CellError,
  cellError,
  type FormulaValue,
  isCellError,
} from "./value.js";

export type { EvaluateContext } from "./context-memory.js";

export interface EvaluateOptions {
  readonly functions: FunctionRegistry;
  readonly context?: EvaluateContext;
}

function isError(v: FormulaValue): v is CellError {
  return isCellError(v);
}

function toNumber(value: FormulaValue): number | CellError {
  if (isError(value)) {
    return value;
  }
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return value;
    }
    return cellError("NUM");
  }
  if (value === null) {
    return 0;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) {
      return n;
    }
    return cellError("VALUE");
  }
  return cellError("VALUE");
}

function applyBinary(
  op: BinaryOperator,
  left: FormulaValue,
  right: FormulaValue,
): FormulaValue {
  if (isError(left)) {
    return left;
  }
  if (isError(right)) {
    return right;
  }

  if (op === "&") {
    const l = left === null ? "" : String(left);
    const r = right === null ? "" : String(right);
    return l + r;
  }

  if (op === "=" || op === "<>") {
    if (typeof left === "string" && typeof right === "string") {
      return op === "=" ? left === right : left !== right;
    }
  }

  const ln = toNumber(left);
  if (isError(ln)) {
    return ln;
  }
  const rn = toNumber(right);
  if (isError(rn)) {
    return rn;
  }

  switch (op) {
    case "+":
      return ln + rn;
    case "-":
      return ln - rn;
    case "*":
      return ln * rn;
    case "/":
      if (rn === 0) {
        return cellError("DIV/0");
      }
      return ln / rn;
    case "^":
      return ln ** rn;
    case "=":
      return ln === rn;
    case "<>":
      return ln !== rn;
    case "<":
      return ln < rn;
    case ">":
      return ln > rn;
    case "<=":
      return ln <= rn;
    case ">=":
      return ln >= rn;
    default: {
      const _exhaustive: never = op;
      return _exhaustive;
    }
  }
}

function applyUnary(op: UnaryOperator, arg: FormulaValue): FormulaValue {
  if (isError(arg)) {
    return arg;
  }
  const n = toNumber(arg);
  if (isError(n)) {
    return n;
  }
  return op === "+" ? n : -n;
}

function evaluateCellRef(
  expr: CellRefExpr,
  options: EvaluateOptions,
): FormulaValue {
  if (options.context === undefined) {
    return cellError("REF");
  }
  return options.context.getCell(expr.address, expr.sheet);
}

function evaluateRangeValues(
  expr: RangeRefExpr,
  options: EvaluateOptions,
): FormulaValue[] {
  if (options.context === undefined) {
    return [cellError("REF")];
  }
  return options.context.getRange(expr.topLeft, expr.bottomRight, expr.sheet);
}

function evaluateCallArgs(
  nodes: readonly Expr[],
  options: EvaluateOptions,
): FormulaValue[] {
  const out: FormulaValue[] = [];
  for (const node of nodes) {
    if (node.kind === "RangeRef") {
      out.push(...evaluateRangeValues(node, options));
    } else if (node.kind === "CellRef") {
      out.push(evaluateCellRef(node, options));
    } else {
      out.push(evaluateExpr(node, options));
    }
  }
  return out;
}

/**
 * 对 AST 求值。无 `context` 时单元格 / 区域引用在标量上下文中为 `#REF!` 或 `#VALUE!`。
 */
export function evaluateExpr(
  expr: Expr,
  options: EvaluateOptions,
): FormulaValue {
  const { functions } = options;

  switch (expr.kind) {
    case "NumberLiteral":
      return expr.value;
    case "StringLiteral":
      return expr.value;
    case "BooleanLiteral":
      return expr.value;
    case "UnaryOp": {
      const v = evaluateExpr(expr.argument, options);
      return applyUnary(expr.op, v);
    }
    case "BinaryOp": {
      const left = evaluateExpr(expr.left, options);
      const right = evaluateExpr(expr.right, options);
      return applyBinary(expr.op, left, right);
    }
    case "Call": {
      const fn = functions.get(expr.name);
      if (fn === undefined) {
        return cellError("NAME");
      }
      const args = evaluateCallArgs(expr.args, options);
      return fn(args);
    }
    case "CellRef":
      return evaluateCellRef(expr, options);
    case "RangeRef":
      return cellError("VALUE");
    default: {
      const _never: never = expr;
      return _never;
    }
  }
}

/** 解析公式字符串并求值；`context` 用于解析单元格 / 区域引用 */
export function evaluateFormula(
  input: string,
  functions: FunctionRegistry = createDefaultRegistry(),
  context?: EvaluateContext,
): FormulaValue {
  const expr = parseFormula(input);
  const options: EvaluateOptions =
    context === undefined ? { functions } : { functions, context };
  return evaluateExpr(expr, options);
}
