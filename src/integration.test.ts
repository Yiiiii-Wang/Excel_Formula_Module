import { describe, expect, it } from "vitest";
import { evaluate } from "./api.js";
import { createMemoryContext } from "./context-memory.js";
import { extractDependencies } from "./dependencies.js";
import { cellError } from "./value.js";

describe("evaluate() public API", () => {
  it("returns ok with value for valid formula", () => {
    const r = evaluate("=1+2*3");
    expect(r).toEqual({ ok: true, value: 7 });
  });

  it("returns ok with cell error as value (not infrastructure failure)", () => {
    const r = evaluate("=1/0");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual(cellError("DIV/0"));
    }
  });

  it("returns failure for invalid syntax", () => {
    const r = evaluate("=1+");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("Parse");
    }
  });

  it("uses context when provided", () => {
    const ctx = createMemoryContext({ A1: 10, B1: 20 });
    const r = evaluate("=A1+B1", ctx);
    expect(r).toEqual({ ok: true, value: 30 });
  });

  it("ignores sheet qualifier for flat memory context", () => {
    const ctx = createMemoryContext({ A1: 5 });
    const r = evaluate("=SheetZ!A1+1", ctx);
    expect(r).toEqual({ ok: true, value: 6 });
  });
});

describe("extractDependencies", () => {
  it("collects cells and expands ranges", () => {
    expect(extractDependencies("=SUM(A1:A2)+B1")).toEqual(["A1", "A2", "B1"]);
  });

  it("includes sheet name in dependency keys for qualified refs", () => {
    expect(extractDependencies("=S1!A1+B1")).toEqual(["B1", "S1!A1"]);
  });

  it("returns empty array for invalid formula", () => {
    expect(extractDependencies("=+++")).toEqual([]);
  });
});
