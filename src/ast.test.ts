import { describe, expect, it } from "vitest";
import { ast, countExprNodes, type Expr } from "./ast.js";

describe("ast factories", () => {
  it("builds literals", () => {
    expect(ast.num(2)).toEqual({ kind: "NumberLiteral", value: 2 });
    expect(ast.str("x")).toEqual({ kind: "StringLiteral", value: "x" });
  });

  it("builds nested binary and call", () => {
    const expr: Expr = ast.binary(
      "+",
      ast.num(1),
      ast.call("SUM", [ast.cell("A1"), ast.range("B1", "B3")]),
    );
    expect(expr.kind).toBe("BinaryOp");
    if (expr.kind === "BinaryOp") {
      expect(expr.right.kind).toBe("Call");
      if (expr.right.kind === "Call") {
        expect(expr.right.name).toBe("SUM");
        expect(expr.right.args[1]?.kind).toBe("RangeRef");
      }
    }
  });

  it("countExprNodes counts nested nodes", () => {
    const expr = ast.call("IF", [
      ast.binary(">", ast.cell("A1"), ast.num(0)),
      ast.cell("B1"),
      ast.str(""),
    ]);
    expect(countExprNodes(expr)).toBe(6);
  });
});
