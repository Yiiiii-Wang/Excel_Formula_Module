import { describe, expect, it } from "vitest";
import { parseFormula } from "./parser.js";

describe("parseFormula", () => {
  it("parses arithmetic precedence and parentheses", () => {
    const expr = parseFormula("=(1 + 2) * 3");
    expect(expr).toEqual({
      kind: "BinaryOp",
      op: "*",
      left: {
        kind: "BinaryOp",
        op: "+",
        left: { kind: "NumberLiteral", value: 1 },
        right: { kind: "NumberLiteral", value: 2 },
      },
      right: { kind: "NumberLiteral", value: 3 },
    });
  });

  it("parses function call and nested function call", () => {
    const expr = parseFormula("=SUM(1, SUM(2, 3))");
    expect(expr).toEqual({
      kind: "Call",
      name: "SUM",
      args: [
        { kind: "NumberLiteral", value: 1 },
        {
          kind: "Call",
          name: "SUM",
          args: [
            { kind: "NumberLiteral", value: 2 },
            { kind: "NumberLiteral", value: 3 },
          ],
        },
      ],
    });
  });

  it("treats bare identifiers as cell references", () => {
    const expr = parseFormula("=A1+2");
    expect(expr).toEqual({
      kind: "BinaryOp",
      op: "+",
      left: { kind: "CellRef", address: "A1" },
      right: { kind: "NumberLiteral", value: 2 },
    });
  });
});
