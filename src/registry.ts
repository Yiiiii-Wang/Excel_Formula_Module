import type { FormulaFunction } from "./builtins.js";
import {
  builtinAbs,
  builtinAnd,
  builtinAverage,
  builtinConcat,
  builtinCount,
  builtinCounta,
  builtinIf,
  builtinInt,
  builtinLeft,
  builtinLen,
  builtinMax,
  builtinMid,
  builtinMin,
  builtinMod,
  builtinNot,
  builtinOr,
  builtinRound,
  builtinSqrt,
  builtinSum,
} from "./builtins.js";

export type { FormulaFunction } from "./builtins.js";
export { builtinMax, builtinMin, builtinSum } from "./builtins.js";

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

export function createDefaultRegistry(): FunctionRegistry {
  const r = new FunctionRegistry();
  r.register("SUM", builtinSum);
  r.register("AVERAGE", builtinAverage);
  r.register("COUNT", builtinCount);
  r.register("COUNTA", builtinCounta);
  r.register("MIN", builtinMin);
  r.register("MAX", builtinMax);
  r.register("ABS", builtinAbs);
  r.register("INT", builtinInt);
  r.register("ROUND", builtinRound);
  r.register("MOD", builtinMod);
  r.register("SQRT", builtinSqrt);
  r.register("IF", builtinIf);
  r.register("AND", builtinAnd);
  r.register("OR", builtinOr);
  r.register("NOT", builtinNot);
  r.register("LEN", builtinLen);
  r.register("LEFT", builtinLeft);
  r.register("MID", builtinMid);
  r.register("CONCAT", builtinConcat);
  return r;
}
