import { describe, expect, it } from "vitest";
import {
  cellError,
  formatErrorDisplay,
  isCellError,
  type FormulaValue,
} from "./value.js";

describe("cellError / isCellError / formatErrorDisplay", () => {
  it("builds structured error and formats like Excel", () => {
    const err = cellError("DIV/0");
    expect(err.kind).toBe("error");
    expect(err.code).toBe("DIV/0");
    expect(formatErrorDisplay(err)).toBe("#DIV/0!");
  });

  it("optional message does not affect display", () => {
    const err = cellError("VALUE", "bad arg");
    expect(isCellError(err)).toBe(true);
    expect(formatErrorDisplay(err)).toBe("#VALUE!");
    expect(err.message).toBe("bad arg");
  });

  it("isCellError is false for primitives", () => {
    expect(isCellError(1)).toBe(false);
    expect(isCellError("#DIV/0!")).toBe(false);
    expect(isCellError(null)).toBe(false);
  });
});

describe("FormulaValue", () => {
  it("accepts scalars and errors", () => {
    const samples: FormulaValue[] = [
      0,
      3.14,
      "text",
      true,
      null,
      cellError("NA"),
    ];
    expect(samples.length).toBe(6);
  });
});
