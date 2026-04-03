import { describe, expect, it } from "vitest";
import { ParseError, parseFormula } from "./parser.js";

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

  it("parses sheet-qualified cell and range", () => {
    expect(parseFormula("=Sheet1!A1+1")).toEqual({
      kind: "BinaryOp",
      op: "+",
      left: { kind: "CellRef", sheet: "SHEET1", address: "A1" },
      right: { kind: "NumberLiteral", value: 1 },
    });
    expect(parseFormula("=SUM(Sheet1!A1:B2)")).toEqual({
      kind: "Call",
      name: "SUM",
      args: [
        {
          kind: "RangeRef",
          sheet: "SHEET1",
          topLeft: "A1",
          bottomRight: "B2",
        },
      ],
    });
  });

  it("rejects formula longer than maxLength", () => {
    const body = "1".repeat(20);
    expect(() => parseFormula(`=${body}`, { maxLength: 10 })).toThrow(
      ParseError,
    );
  });

  it("rejects AST deeper than maxAstDepth", () => {
    let inner = "1";
    for (let i = 0; i < 30; i++) {
      inner = `(${inner}+1)`;
    }
    expect(() => parseFormula(`=${inner}`, { maxAstDepth: 12 })).toThrow(
      ParseError,
    );
  });
});
