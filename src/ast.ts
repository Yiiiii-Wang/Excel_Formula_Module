/**
 * 公式抽象语法树（AST）。嵌套 = 子表达式挂在节点上。
 * 解析器尚未实现时，可用手写 AST 做求值器单测。
 */

/** 二元运算符（含算术、比较、文本连接） */
export type BinaryOperator =
  | "+"
  | "-"
  | "*"
  | "/"
  | "^"
  | "="
  | "<>"
  | "<"
  | ">"
  | "<="
  | ">="
  | "&";

/** 一元运算符 */
export type UnaryOperator = "+" | "-";

export type Expr =
  | NumberLiteralExpr
  | StringLiteralExpr
  | BooleanLiteralExpr
  | BinaryOpExpr
  | UnaryOpExpr
  | CallExpr
  | CellRefExpr
  | RangeRefExpr;

export interface NumberLiteralExpr {
  readonly kind: "NumberLiteral";
  readonly value: number;
}

export interface StringLiteralExpr {
  readonly kind: "StringLiteral";
  readonly value: string;
}

export interface BooleanLiteralExpr {
  readonly kind: "BooleanLiteral";
  readonly value: boolean;
}

export interface BinaryOpExpr {
  readonly kind: "BinaryOp";
  readonly op: BinaryOperator;
  readonly left: Expr;
  readonly right: Expr;
}

export interface UnaryOpExpr {
  readonly kind: "UnaryOp";
  readonly op: UnaryOperator;
  readonly argument: Expr;
}

export interface CallExpr {
  readonly kind: "Call";
  /** 大写函数名，如 SUM、IF */
  readonly name: string;
  readonly args: readonly Expr[];
}

/** 单个单元格引用，如 A1 或 Sheet1!B2 */
export interface CellRefExpr {
  readonly kind: "CellRef";
  /** 工作表名，省略表示当前表 */
  readonly sheet?: string;
  /** A1 样式地址 */
  readonly address: string;
}

/** 矩形区域引用，如 A1:B2 */
export interface RangeRefExpr {
  readonly kind: "RangeRef";
  readonly sheet?: string;
  readonly topLeft: string;
  readonly bottomRight: string;
}

/** 便于测试与后续解析器组装的轻量工厂 */
export const ast = {
  num(value: number): NumberLiteralExpr {
    return { kind: "NumberLiteral", value };
  },
  str(value: string): StringLiteralExpr {
    return { kind: "StringLiteral", value };
  },
  bool(value: boolean): BooleanLiteralExpr {
    return { kind: "BooleanLiteral", value };
  },
  binary(op: BinaryOperator, left: Expr, right: Expr): BinaryOpExpr {
    return { kind: "BinaryOp", op, left, right };
  },
  unary(op: UnaryOperator, argument: Expr): UnaryOpExpr {
    return { kind: "UnaryOp", op, argument };
  },
  call(name: string, args: readonly Expr[]): CallExpr {
    return { kind: "Call", name, args };
  },
  cell(address: string, sheet?: string): CellRefExpr {
    return sheet === undefined
      ? { kind: "CellRef", address }
      : { kind: "CellRef", sheet, address };
  },
  range(topLeft: string, bottomRight: string, sheet?: string): RangeRefExpr {
    return sheet === undefined
      ? { kind: "RangeRef", topLeft, bottomRight }
      : { kind: "RangeRef", sheet, topLeft, bottomRight };
  },
} as const;

/** 遍历表达式树节点数量（含嵌套） */
export function countExprNodes(expr: Expr): number {
  switch (expr.kind) {
    case "NumberLiteral":
    case "StringLiteral":
    case "BooleanLiteral":
      return 1;
    case "BinaryOp":
      return 1 + countExprNodes(expr.left) + countExprNodes(expr.right);
    case "UnaryOp":
      return 1 + countExprNodes(expr.argument);
    case "Call":
      return (
        1 + expr.args.reduce((n, arg) => n + countExprNodes(arg), 0)
      );
    case "CellRef":
    case "RangeRef":
      return 1;
  }
}
