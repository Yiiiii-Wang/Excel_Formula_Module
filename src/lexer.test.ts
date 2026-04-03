import { describe, expect, it } from "vitest";
import { LexError, tokenizeFormula } from "./lexer.js";

describe("tokenizeFormula", () => {
  it("tokenizes arithmetic and function calls", () => {
    const tokens = tokenizeFormula("=SUM(1, 2.5) + 3");
    expect(tokens.map((t) => [t.kind, t.lexeme])).toEqual([
      ["IDENT", "SUM"],
      ["LPAREN", "("],
      ["NUMBER", "1"],
      ["COMMA", ","],
      ["NUMBER", "2.5"],
      ["RPAREN", ")"],
      ["PLUS", "+"],
      ["NUMBER", "3"],
      ["EOF", ""],
    ]);
  });

  it("tokenizes string and comparison operators", () => {
    const tokens = tokenizeFormula('"ok"<>"bad" <= 10');
    expect(tokens.map((t) => [t.kind, t.lexeme])).toEqual([
      ["STRING", '"ok"'],
      ["NE", "<>"],
      ["STRING", '"bad"'],
      ["LE", "<="],
      ["NUMBER", "10"],
      ["EOF", ""],
    ]);
  });

  it("tokenizes & and :", () => {
    const tokens = tokenizeFormula('A1:B2&"x"');
    expect(tokens.map((t) => [t.kind, t.lexeme])).toEqual([
      ["IDENT", "A1"],
      ["COLON", ":"],
      ["IDENT", "B2"],
      ["AMP", "&"],
      ["STRING", '"x"'],
      ["EOF", ""],
    ]);
  });

  it("tokenizes scientific notation and percent suffix", () => {
    expect(tokenizeFormula("1e-2+3E+1").map((t) => [t.kind, t.lexeme])).toEqual(
      [
        ["NUMBER", "1e-2"],
        ["PLUS", "+"],
        ["NUMBER", "3E+1"],
        ["EOF", ""],
      ],
    );
    expect(tokenizeFormula("50%*2").map((t) => [t.kind, t.lexeme])).toEqual([
      ["NUMBER", "50%"],
      ["STAR", "*"],
      ["NUMBER", "2"],
      ["EOF", ""],
    ]);
  });

  it("tokenizes sheet-qualified references", () => {
    const tokens = tokenizeFormula("Sheet1!A1:B2+1");
    expect(tokens.map((t) => [t.kind, t.lexeme])).toEqual([
      ["IDENT", "Sheet1"],
      ["BANG", "!"],
      ["IDENT", "A1"],
      ["COLON", ":"],
      ["IDENT", "B2"],
      ["PLUS", "+"],
      ["NUMBER", "1"],
      ["EOF", ""],
    ]);
  });

  it("throws on unexpected characters", () => {
    expect(() => tokenizeFormula("1@2")).toThrow(LexError);
  });
});
