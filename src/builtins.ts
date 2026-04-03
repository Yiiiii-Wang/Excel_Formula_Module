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

type AggregateNumberResult =
  | { readonly kind: "num"; readonly value: number }
  | { readonly kind: "skip" }
  | { readonly kind: "err"; readonly error: ReturnType<typeof cellError> };

/** 与 Excel 聚合函数类似：空与非数字文本跳过；布尔按 0/1；错误与 NUM 传播 */
function tryAggregateNumeric(value: FormulaValue): AggregateNumberResult {
  if (isCellError(value)) {
    return { kind: "err", error: value };
  }
  if (value === null) {
    return { kind: "skip" };
  }
  if (typeof value === "number") {
    if (Number.isFinite(value)) {
      return { kind: "num", value };
    }
    return { kind: "err", error: cellError("NUM") };
  }
  if (typeof value === "boolean") {
    return { kind: "num", value: value ? 1 : 0 };
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (t === "") {
      return { kind: "skip" };
    }
    const n = Number(t);
    if (Number.isFinite(n)) {
      return { kind: "num", value: n };
    }
    return { kind: "skip" };
  }
  return { kind: "skip" };
}

/** 与 Excel 类似：忽略空与非数字文本；遇错误单元格则返回该错误；无数字项时为 #DIV/0! */
export function builtinAverage(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  let sum = 0;
  let count = 0;
  for (const v of args) {
    const r = tryAggregateNumeric(v);
    if (r.kind === "err") {
      return r.error;
    }
    if (r.kind === "num") {
      sum += r.value;
      count++;
    }
  }
  if (count === 0) {
    return cellError("DIV/0");
  }
  return sum / count;
}

export function builtinNow(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 0) {
    return cellError("VALUE");
  }
  return Date.now();
}

export function builtinRand(args: readonly FormulaValue[]): FormulaValue {
  if (args.length !== 0) {
    return cellError("VALUE");
  }
  return Math.random();
}

/** 仅统计有限数值（与 Excel COUNT 对区域展开的行为一致） */
export function builtinCount(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  let n = 0;
  for (const v of args) {
    if (typeof v === "number" && Number.isFinite(v)) {
      n++;
    }
  }
  return n;
}

/** 统计非空项（null、"" 不计；错误需先由 firstError 抛出） */
export function builtinCounta(args: readonly FormulaValue[]): FormulaValue {
  const err = firstError(args);
  if (err !== undefined) {
    return err;
  }
  let n = 0;
  for (const v of args) {
    if (v === null) {
      continue;
    }
    if (typeof v === "string" && v === "") {
      continue;
    }
    n++;
  }
  return n;
}

/** 与 Excel 类似：跳过空与非数字文本；遇错误单元格则返回该错误 */
export function builtinSum(args: readonly FormulaValue[]): FormulaValue {
  let total = 0;
  for (const v of args) {
    const r = tryAggregateNumeric(v);
    if (r.kind === "err") {
      return r.error;
    }
    if (r.kind === "num") {
      total += r.value;
    }
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
