import {
  type CellError,
  cellError,
  type FormulaValue,
  isCellError,
} from "./value.js";

export type FormulaFunction = (args: readonly FormulaValue[]) => FormulaValue;

function firstError(
  args: readonly FormulaValue[],
): ReturnType<typeof cellError> | undefined {
  for (const v of args) {
    if (isCellError(v)) {
      return v;
    }
  }
  return undefined;
}

function toNumber(value: FormulaValue): number | ReturnType<typeof cellError> {
  if (isCellError(value)) {
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

/** Excel 风格向下取整（INT） */
function excelInt(n: number): number {
  return Math.floor(n);
}

function excelMod(n: number, divisor: number): FormulaValue {
  if (divisor === 0) {
    return cellError("DIV/0");
  }
  return n - divisor * excelInt(n / divisor);
}

function roundHalfAway(n: number, digits: number): number {
  const m = 10 ** digits;
  const x = n * m;
  const rounded = x >= 0 ? Math.round(x) : -Math.round(-x);
  return rounded / m;
}

/** 转为逻辑值；用于 IF / AND / OR */
export function toLogical(value: FormulaValue): boolean | CellError {
  if (isCellError(value)) {
    return value;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const u = value.trim().toUpperCase();
    if (u === "TRUE") {
      return true;
    }
    if (u === "FALSE") {
      return false;
    }
    return value !== "";
  }
  if (value === null) {
    return false;
  }
  return false;
}

export function builtinSum(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  let total = 0;
  for (const v of args) {
    const n = toNumber(v);
    if (isCellError(n)) {
      return n;
    }
    total += n;
  }
  return total;
}

export function builtinMin(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  if (args.length === 0) {
    return cellError("VALUE");
  }
  const nums: number[] = [];
  for (const v of args) {
    const n = toNumber(v);
    if (isCellError(n)) {
      return n;
    }
    nums.push(n);
  }
  return Math.min(...nums);
}

export function builtinMax(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  if (args.length === 0) {
    return cellError("VALUE");
  }
  const nums: number[] = [];
  for (const v of args) {
    const n = toNumber(v);
    if (isCellError(n)) {
      return n;
    }
    nums.push(n);
  }
  return Math.max(...nums);
}

export function builtinAbs(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 1) {
    return cellError("VALUE");
  }
  const n = toNumber(args[0]!);
  if (isCellError(n)) {
    return n;
  }
  return Math.abs(n);
}

export function builtinInt(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 1) {
    return cellError("VALUE");
  }
  const n = toNumber(args[0]!);
  if (isCellError(n)) {
    return n;
  }
  return excelInt(n);
}

export function builtinRound(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 2) {
    return cellError("VALUE");
  }
  const n = toNumber(args[0]!);
  const d = toNumber(args[1]!);
  if (isCellError(n) || isCellError(d)) {
    return isCellError(n) ? n : d;
  }
  if (!Number.isInteger(d)) {
    return cellError("VALUE");
  }
  return roundHalfAway(n, d);
}

export function builtinMod(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 2) {
    return cellError("VALUE");
  }
  const n = toNumber(args[0]!);
  const d = toNumber(args[1]!);
  if (isCellError(n) || isCellError(d)) {
    return isCellError(n) ? n : d;
  }
  return excelMod(n, d);
}

export function builtinSqrt(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 1) {
    return cellError("VALUE");
  }
  const n = toNumber(args[0]!);
  if (isCellError(n)) {
    return n;
  }
  if (n < 0) {
    return cellError("NUM");
  }
  return Math.sqrt(n);
}

export function builtinIf(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 3) {
    return cellError("VALUE");
  }
  const c = args[0]!;
  const a = args[1]!;
  const b = args[2]!;
  const lg = toLogical(c);
  if (isCellError(lg)) {
    return lg;
  }
  return lg ? a : b;
}

export function builtinAnd(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  for (const v of args) {
    const lg = toLogical(v);
    if (isCellError(lg)) {
      return lg;
    }
    if (!lg) {
      return false;
    }
  }
  return true;
}

export function builtinOr(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  for (const v of args) {
    const lg = toLogical(v);
    if (isCellError(lg)) {
      return lg;
    }
    if (lg) {
      return true;
    }
  }
  return false;
}

export function builtinNot(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 1) {
    return cellError("VALUE");
  }
  const lg = toLogical(args[0]!);
  if (isCellError(lg)) {
    return lg;
  }
  return !lg;
}

export function builtinLen(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 1) {
    return cellError("VALUE");
  }
  const v = args[0]!;
  if (isCellError(v)) {
    return v;
  }
  if (typeof v === "string") {
    return v.length;
  }
  if (v === null) {
    return 0;
  }
  return String(v).length;
}

export function builtinLeft(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 2) {
    return cellError("VALUE");
  }
  const s = args[0]!;
  const n = toNumber(args[1]!);
  if (isCellError(s)) {
    return s;
  }
  if (isCellError(n)) {
    return n;
  }
  if (!Number.isInteger(n) || n < 0) {
    return cellError("VALUE");
  }
  const text = s === null ? "" : String(s);
  return text.slice(0, n);
}

export function builtinMid(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 3) {
    return cellError("VALUE");
  }
  const s = args[0]!;
  const start = toNumber(args[1]!);
  const len = toNumber(args[2]!);
  if (isCellError(s)) {
    return s;
  }
  if (isCellError(start) || isCellError(len)) {
    return isCellError(start) ? start : len;
  }
  if (
    !Number.isInteger(start) ||
    !Number.isInteger(len) ||
    start < 1 ||
    len < 0
  ) {
    return cellError("VALUE");
  }
  const text = s === null ? "" : String(s);
  return text.slice(start - 1, start - 1 + len);
}

export function builtinConcat(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  let out = "";
  for (const v of args) {
    if (v === null) {
      continue;
    }
    out += String(v);
  }
  return out;
}
