import type { EvaluateContext } from "./context-memory.js";
import { type EvaluateOptions, evaluateExpr } from "./evaluate.js";
import { LexError } from "./lexer.js";
import { ParseError, parseFormula } from "./parser.js";
import { createDefaultRegistry, type FunctionRegistry } from "./registry.js";
import type { FormulaValue } from "./value.js";

/** 词法 / 语法失败；公式求值得到的 `#DIV/0!` 等仍在 `ok: true` 的 `value` 里 */
export type EvaluateFailureKind = "Lex" | "Parse";

export type EvaluateResult =
  | { ok: true; value: FormulaValue }
  | {
      ok: false;
      error: {
        readonly kind: EvaluateFailureKind;
        readonly message: string;
      };
    };

export interface EvaluateApiOptions {
  readonly functions?: FunctionRegistry;
}

/**
 * 对外入口：去掉前导 `=`（在 `tokenize` 中）、解析、求值一步完成。
 * 词法/解析异常返回 `{ ok: false }`；求值结果含 Excel 风格错误值时仍为 `{ ok: true, value }`。
 */
export function evaluate(
  formula: string,
  context?: EvaluateContext,
  options?: EvaluateApiOptions,
): EvaluateResult {
  try {
    const expr = parseFormula(formula);
    const functions = options?.functions ?? createDefaultRegistry();
    const opts: EvaluateOptions =
      context === undefined ? { functions } : { functions, context };
    const value = evaluateExpr(expr, opts);
    return { ok: true, value };
  } catch (e) {
    if (e instanceof LexError) {
      return { ok: false, error: { kind: "Lex", message: e.message } };
    }
    if (e instanceof ParseError) {
      return { ok: false, error: { kind: "Parse", message: e.message } };
    }
    throw e;
  }
}
