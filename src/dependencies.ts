import type { Expr } from "./ast.js";
import { parseFormula } from "./parser.js";
import { expandRangeAddresses } from "./range-address.js";

function walkExpr(expr: Expr, out: Set<string>): void {
  switch (expr.kind) {
    case "NumberLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
      return;
    case "UnaryOp":
      walkExpr(expr.argument, out);
      return;
    case "BinaryOp":
      walkExpr(expr.left, out);
      walkExpr(expr.right, out);
      return;
    case "Call":
      for (const arg of expr.args) {
        walkExpr(arg, out);
      }
      return;
    case "CellRef": {
      const addr = expr.address.trim().toUpperCase();
      if (expr.sheet !== undefined) {
        out.add(`${expr.sheet.trim().toUpperCase()}!${addr}`);
      } else {
        out.add(addr);
      }
      return;
    }
    case "RangeRef": {
      try {
        const cells = expandRangeAddresses(
          expr.topLeft.trim().toUpperCase(),
          expr.bottomRight.trim().toUpperCase(),
        );
        const sh = expr.sheet?.trim().toUpperCase();
        for (const c of cells) {
          out.add(sh !== undefined ? `${sh}!${c}` : c);
        }
      } catch {
        // 非法区域则跳过
      }
      return;
    }
  }
}

/**
 * 从公式字符串解析 AST，收集所有单元格依赖（区域会展开为矩形内全部 A1 地址）。
 * 非法公式返回空数组（不抛错，便于表格引擎批量扫描）。
 */
export function extractDependencies(formula: string): readonly string[] {
  try {
    const expr = parseFormula(formula);
    const set = new Set<string>();
    walkExpr(expr, set);
    return [...set].sort();
  } catch {
    return [];
  }
}
