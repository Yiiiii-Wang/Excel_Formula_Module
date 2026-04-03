import { describe, expect, it } from "vitest";
import { createMemoryContext } from "./context-memory.js";
import { evaluateFormula } from "./evaluate.js";
import { parseFormula } from "./parser.js";
import { createDefaultRegistry } from "./registry.js";
import { cellError } from "./value.js";

describe("parser: precedence and range", () => {
  it("parses & lower than + - (Excel order)", () => {
    const expr = parseFormula('=1+2&"3"');
    expect(expr).toEqual({
      kind: "BinaryOp",
      op: "&",
      left: {
        kind: "BinaryOp",
        op: "+",
        left: { kind: "NumberLiteral", value: 1 },
        right: { kind: "NumberLiteral", value: 2 },
      },
      right: { kind: "StringLiteral", value: "3" },
    });
  });

  it("parses ^ as right-associative", () => {
    const expr = parseFormula("=2^3^2");
    expect(expr).toEqual({
      kind: "BinaryOp",
      op: "^",
      left: { kind: "NumberLiteral", value: 2 },
      right: {
        kind: "BinaryOp",
        op: "^",
        left: { kind: "NumberLiteral", value: 3 },
        right: { kind: "NumberLiteral", value: 2 },
      },
    });
  });

  it("parses A1:B2 as RangeRef", () => {
    expect(parseFormula("=A1:B2")).toEqual({
      kind: "RangeRef",
      topLeft: "A1",
      bottomRight: "B2",
    });
  });
});

describe("evaluator: operators", () => {
  it("evaluates concat after addition", () => {
    expect(evaluateFormula('=1+2&"3"')).toBe("33");
  });

  it("evaluates right-associative exponent", () => {
    expect(evaluateFormula("=2^3^2")).toBe(512);
  });

  it("compares string equality", () => {
    expect(evaluateFormula('="a"="a"')).toBe(true);
    expect(evaluateFormula('="a"="b"')).toBe(false);
  });
});

describe("built-in functions", () => {
  it("ABS / INT / ROUND / MOD / SQRT", () => {
    expect(evaluateFormula("=ABS(-3)")).toBe(3);
    expect(evaluateFormula("=INT(8.9)")).toBe(8);
    expect(evaluateFormula("=ROUND(1.234,2)")).toBe(1.23);
    expect(evaluateFormula("=MOD(10,3)")).toBe(1);
    expect(evaluateFormula("=SQRT(4)")).toBe(2);
    expect(evaluateFormula("=SQRT(-1)")).toEqual(cellError("NUM"));
  });

  it("IF / AND / OR / NOT", () => {
    expect(evaluateFormula("=IF(1,2,3)")).toBe(2);
    expect(evaluateFormula("=IF(0,2,3)")).toBe(3);
    expect(evaluateFormula("=AND(TRUE,TRUE)")).toBe(true);
    expect(evaluateFormula("=OR(FALSE,TRUE)")).toBe(true);
    expect(evaluateFormula("=NOT(TRUE)")).toBe(false);
  });

  it("LEN / LEFT / MID / CONCAT", () => {
    expect(evaluateFormula('=LEN("ab")')).toBe(2);
    expect(evaluateFormula('=LEFT("abc",2)')).toBe("ab");
    expect(evaluateFormula('=MID("abcdef",2,3)')).toBe("bcd");
    expect(evaluateFormula('=CONCAT("a","b",2)')).toBe("ab2");
  });
});

describe("EvaluateContext (memory mock)", () => {
  it("sums a range from memory cells", () => {
    const ctx = createMemoryContext({
      A1: 1,
      A2: 2,
      A3: 3,
    });
    expect(evaluateFormula("=SUM(A1:A3)", createDefaultRegistry(), ctx)).toBe(
      6,
    );
  });

  it("returns REF without context for bare cell", () => {
    expect(evaluateFormula("=A1")).toEqual(cellError("REF"));
  });
});
