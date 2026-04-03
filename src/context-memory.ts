import { expandRangeAddresses } from "./range-address.js";
import type { FormulaValue } from "./value.js";

/** 求值时解析单元格与区域：由宿主（表格引擎）实现；测试可用内存 Map */
export interface EvaluateContext {
  getCell(address: string, sheet?: string): FormulaValue;
  getRange(
    topLeft: string,
    bottomRight: string,
    sheet?: string,
  ): FormulaValue[];
}

/** `cells` 的 key 使用大写 A1，如 `A1`、`B2` */
export function createMemoryContext(
  cells: Readonly<Record<string, FormulaValue>>,
): EvaluateContext {
  const norm = (addr: string): string => addr.trim().toUpperCase();
  return {
    getCell(address: string): FormulaValue {
      return cells[norm(address)] ?? null;
    },
    getRange(topLeft: string, bottomRight: string): FormulaValue[] {
      const keys = expandRangeAddresses(norm(topLeft), norm(bottomRight));
      return keys.map((k) => cells[k] ?? null);
    },
  };
}
