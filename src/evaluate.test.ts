import { describe, expect, it } from "vitest";
import { ast } from "./ast.js";
import { evaluateExpr, evaluateFormula } from "./evaluate.js";
import { createDefaultRegistry, FunctionRegistry } from "./registry.js";
import { cellError } from "./value.js";

describe("evaluateExpr", () => {
  const functions = createDefaultRegistry();

  it("evaluates 1+2", () => {
    const expr = ast.binary("+", ast.num(1), ast.num(2));
    expect(evaluateExpr(expr, { functions })).toBe(3);
  });

  it("evaluates (1+2)*3", () => {
    const expr = ast.binary(
      "*",
      ast.binary("+", ast.num(1), ast.num(2)),
      ast.num(3),
    );
    expect(evaluateExpr(expr, { functions })).toBe(9);
  });

  it("evaluates nested SUM", () => {
    const expr = ast.call("SUM", [
      ast.num(1),
      ast.call("SUM", [ast.num(2), ast.num(3)]),
    ]);
    expect(evaluateExpr(expr, { functions })).toBe(6);
  });

  it("division by zero returns DIV/0", () => {
    const expr = ast.binary("/", ast.num(1), ast.num(0));
    const v = evaluateExpr(expr, { functions });
    expect(v).toEqual(cellError("DIV/0"));
  });
});

describe("evaluateFormula (parse + eval)", () => {
  it("evaluates =SUM(1,2,3)", () => {
    expect(evaluateFormula("=SUM(1,2,3)")).toBe(6);
  });

  it("SUM skips non-numeric text like Excel", () => {
    expect(evaluateFormula('=SUM(1,"x",2)')).toBe(3);
  });

  it("evaluates =SUM(1, SUM(2,3))", () => {
    expect(evaluateFormula("=SUM(1, SUM(2,3))")).toBe(6);
  });

  it("evaluates arithmetic from string", () => {
    expect(evaluateFormula("=1+2")).toBe(3);
    expect(evaluateFormula("=(1+2)*3")).toBe(9);
  });
});

describe("FunctionRegistry", () => {
  it("supports register(name, fn)", () => {
    const r = new FunctionRegistry();
    r.register("DOUBLE", (args) => {
      const x = args[0];
      if (typeof x === "number") {
        return x * 2;
      }
      return cellError("VALUE");
    });
    const expr = ast.call("DOUBLE", [ast.num(21)]);
    expect(evaluateExpr(expr, { functions: r })).toBe(42);
  });
});
