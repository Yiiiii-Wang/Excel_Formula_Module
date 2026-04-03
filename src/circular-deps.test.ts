import { describe, expect, it } from "vitest";
import { findFormulaCellsWithCircularReference } from "./circular-deps.js";

function find(entries: Record<string, string>): Set<string> {
  const formulaKeys = new Set<string>();
  for (const [k, v] of Object.entries(entries)) {
    if (v.trimStart().startsWith("=")) {
      formulaKeys.add(k.toUpperCase());
    }
  }
  const inputs: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    inputs[k.toUpperCase()] = v;
  }
  return findFormulaCellsWithCircularReference(formulaKeys, inputs);
}

describe("findFormulaCellsWithCircularReference", () => {
  it("detects self-reference in cell", () => {
    const s = find({ B2: "=B2+B7", B7: "-200" });
    expect(s.has("B2")).toBe(true);
    expect(s.has("B7")).toBe(false);
  });

  it("propagates to cells that depend on a circular cell", () => {
    const s = find({
      A1: "=B2+1",
      B2: "=B2+1",
    });
    expect(s.has("B2")).toBe(true);
    expect(s.has("A1")).toBe(true);
  });

  it("detects three-way cycle", () => {
    const s = find({
      A1: "=B1",
      B1: "=C1",
      C1: "=A1",
    });
    expect(s.has("A1") && s.has("B1") && s.has("C1")).toBe(true);
  });

  it("does not flag acyclic chain", () => {
    const s = find({
      A1: "1",
      B1: "=A1+1",
      C1: "=B1+1",
    });
    expect(s.size).toBe(0);
  });
});
