import {
  cellError,
  isCellError,
  type CellError,
  type FormulaValue,
} from "./value.js";

/** 内置函数签名：参数为已求值结果 */
export type FormulaFunction = (args: readonly FormulaValue[]) => FormulaValue;

export class FunctionRegistry {
  private readonly map = new Map<string, FormulaFunction>();

  register(name: string, fn: FormulaFunction): void {
    this.map.set(name.toUpperCase(), fn);
  }

  get(name: string): FormulaFunction | undefined {
    return this.map.get(name.toUpperCase());
  }

  has(name: string): boolean {
    return this.map.has(name.toUpperCase());
  }
}

function firstError(args: readonly FormulaValue[]): CellError | undefined {
  for (const v of args) {
    if (isCellError(v)) {
      return v;
    }
  }
  return undefined;
}

function toNumber(value: FormulaValue): number | CellError {
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

/** 内置 SUM：忽略 null 当 0；非数字且无法转换则 VALUE；遇错误先传播 */
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

/** 内置 MIN */
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

/** 内置 MAX */
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

/** 注册 SUM、MIN、MAX */
export function createDefaultRegistry(): FunctionRegistry {
  const r = new FunctionRegistry();
  r.register("SUM", builtinSum);
  r.register("MIN", builtinMin);
  r.register("MAX", builtinMax);
  return r;
}
