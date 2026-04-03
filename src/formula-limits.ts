import type { Expr } from "./ast.js";

/** 默认单条公式最大字符数（含前导 `=`） */
export const DEFAULT_MAX_FORMULA_LENGTH = 8192;

/** 默认 AST 最大深度（根为 1） */
export const DEFAULT_MAX_AST_DEPTH = 128;

export function computeMaxAstDepth(expr: Expr): number {
  switch (expr.kind) {
    case "NumberLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
      return 1;
    case "UnaryOp":
      return 1 + computeMaxAstDepth(expr.argument);
    case "BinaryOp":
      return (
        1 +
        Math.max(computeMaxAstDepth(expr.left), computeMaxAstDepth(expr.right))
      );
    case "Call": {
      let maxArg = 0;
      for (const a of expr.args) {
        maxArg = Math.max(maxArg, computeMaxAstDepth(a));
      }
      return 1 + maxArg;
    }
    case "CellRef":
    case "RangeRef":
      return 1;
    default: {
      const _never: never = expr;
      return _never;
    }
  }
}
