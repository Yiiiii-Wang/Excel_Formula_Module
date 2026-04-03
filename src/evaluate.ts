import type { BinaryOperator, Expr, UnaryOperator } from "./ast.js";
import { parseFormula } from "./parser.js";
import {
  createDefaultRegistry,
  type FunctionRegistry,
} from "./registry.js";
import { cellError, isCellError, type CellError, type FormulaValue } from "./value.js";

export interface EvaluateOptions {
  readonly functions: FunctionRegistry;
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

function applyBinary(op: BinaryOperator, left: FormulaValue, right: FormulaValue): FormulaValue {
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
      return Math.pow(ln, rn);
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

/**
 * 对 AST 求值。未提供单元格上下文时，`CellRef` / `RangeRef` 返回 `#REF!`。
 */
export function evaluateExpr(expr: Expr, options: EvaluateOptions): FormulaValue {
  const { functions } = options;

  switch (expr.kind) {
    case "NumberLiteral":
      return expr.value;
    case "StringLiteral":
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
      const args = expr.args.map((a) => evaluateExpr(a, options));
      return fn(args);
    }
    case "CellRef":
    case "RangeRef":
      return cellError("REF");
    default: {
      const _never: never = expr;
      return _never;
    }
  }
}

/** 解析公式字符串并用给定（或默认）函数表求值 */
export function evaluateFormula(
  input: string,
  functions: FunctionRegistry = createDefaultRegistry(),
): FormulaValue {
  const expr = parseFormula(input);
  return evaluateExpr(expr, { functions });
}
