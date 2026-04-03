/**
 * 公式求值后的「普通值」与 Excel 风格错误。
 * 本模块不包含解析逻辑，仅类型与展示约定。
 */

/** 与 Excel 常见错误一一对应的内部代码（不含 # 与 !） */
export type ExcelErrorCode =
  | "DIV/0"
  | "VALUE"
  | "REF"
  | "NAME"
  | "NUM"
  | "NA"
  | "NULL";

/** 结构化错误，求值器可返回此类型以表示 #DIV/0! 等 */
export interface CellError {
  readonly kind: "error";
  readonly code: ExcelErrorCode;
  readonly message?: string;
}

/**
 * 标量：数字、文本、布尔、空（空单元格 / 空值用 null）。
 * 错误用 CellError 表示，不混在 string 里。
 */
export type FormulaScalar = number | string | boolean | null;

/** 一次求值可能得到的结果 */
export type FormulaValue = FormulaScalar | CellError;

export function isCellError(value: unknown): value is CellError {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    (value as CellError).kind === "error"
  );
}

export function cellError(code: ExcelErrorCode, message?: string): CellError {
  return message === undefined
    ? { kind: "error", code }
    : { kind: "error", code, message };
}

/** 与 Excel 界面一致的显示字符串，例如 DIV/0 → `#DIV/0!` */
const DISPLAY_BY_CODE: Record<ExcelErrorCode, string> = {
  "DIV/0": "#DIV/0!",
  VALUE: "#VALUE!",
  REF: "#REF!",
  NAME: "#NAME?",
  NUM: "#NUM!",
  NA: "#N/A",
  NULL: "#NULL!",
};

export function formatErrorDisplay(err: CellError): string {
  return DISPLAY_BY_CODE[err.code];
}
