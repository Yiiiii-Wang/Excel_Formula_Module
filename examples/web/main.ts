import { evaluate } from "../../src/api.ts";
import type { EvaluateContext } from "../../src/context-memory.ts";
import { expandRangeAddresses } from "../../src/range-address.ts";
import { formatErrorDisplay, isCellError, type FormulaValue } from "../../src/value.ts";

const COLS = 6;
const ROWS = 8;

function address(col: number, row: number): string {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

function isFormula(raw: string): boolean {
  return raw.trimStart().startsWith("=");
}

function literalToValue(raw: string): FormulaValue {
  const t = raw.trim();
  if (t === "") {
    return null;
  }
  const n = Number(t);
  if (Number.isFinite(n) && t !== "") {
    return n;
  }
  return t;
}

function createSheetContext(
  inputs: Record<string, string>,
  computed: Record<string, FormulaValue>,
): EvaluateContext {
  const getCell = (addr: string): FormulaValue => {
    const key = addr.trim().toUpperCase();
    if (Object.prototype.hasOwnProperty.call(computed, key)) {
      const v = computed[key];
      if (v !== undefined) {
        return v;
      }
    }
    const raw = inputs[key] ?? "";
    if (isFormula(raw)) {
      const v = computed[key];
      return v !== undefined ? v : null;
    }
    return literalToValue(raw);
  };

  return {
    getCell: (a) => getCell(a),
    getRange: (topLeft, bottomRight) => {
      const keys = expandRangeAddresses(
        topLeft.trim().toUpperCase(),
        bottomRight.trim().toUpperCase(),
      );
      return keys.map((k) => getCell(k));
    },
  };
}

function formatValue(v: FormulaValue): string {
  if (isCellError(v)) {
    return formatErrorDisplay(v);
  }
  if (v === null) {
    return "";
  }
  if (typeof v === "boolean") {
    return v ? "TRUE" : "FALSE";
  }
  return String(v);
}

function collectInputs(): Record<string, string> {
  const inputs: Record<string, string> = {};
  const nodes = document.querySelectorAll<HTMLInputElement>("[data-cell]");
  for (const el of nodes) {
    const key = el.dataset.cell;
    if (key !== undefined) {
      inputs[key.toUpperCase()] = el.value;
    }
  }
  return inputs;
}

function recalc(inputs: Record<string, string>): Record<string, FormulaValue> {
  const computed: Record<string, FormulaValue> = {};
  const formulaKeys: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = address(c, r);
      if (isFormula(inputs[key] ?? "")) {
        formulaKeys.push(key);
      }
    }
  }
  const passes = 40;
  for (let p = 0; p < passes; p++) {
    for (const key of formulaKeys) {
      const raw = inputs[key] ?? "";
      const ctx = createSheetContext(inputs, computed);
      const res = evaluate(raw, ctx);
      if (res.ok) {
        computed[key] = res.value;
      } else {
        computed[key] = {
          kind: "error",
          code: "VALUE",
          message: res.error.message,
        };
      }
    }
  }
  return computed;
}

function renderSheet(): void {
  const table = document.getElementById("sheet");
  if (table === null) {
    return;
  }
  table.replaceChildren();

  const thead = document.createElement("thead");
  const hr = document.createElement("tr");
  const corner = document.createElement("th");
  corner.className = "corner";
  corner.textContent = "";
  hr.append(corner);
  for (let c = 0; c < COLS; c++) {
    const th = document.createElement("th");
    th.textContent = String.fromCharCode(65 + c);
    hr.append(th);
  }
  thead.append(hr);
  table.append(thead);

  const tbody = document.createElement("tbody");
  for (let r = 0; r < ROWS; r++) {
    const tr = document.createElement("tr");
    const rh = document.createElement("th");
    rh.textContent = String(r + 1);
    tr.append(rh);
    for (let c = 0; c < COLS; c++) {
      const td = document.createElement("td");
      const inner = document.createElement("div");
      inner.className = "cell-inner";
      const input = document.createElement("input");
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      const addr = address(c, r);
      input.dataset.cell = addr;
      const out = document.createElement("div");
      out.className = "cell-out empty";
      out.dataset.out = addr;
      out.textContent = " ";
      inner.append(input, out);
      td.append(inner);
      tr.append(td);
    }
    tbody.append(tr);
  }
  table.append(tbody);
}

function applyResults(
  inputs: Record<string, string>,
  computed: Record<string, FormulaValue>,
): void {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const key = address(c, r);
      const el = document.querySelector(`[data-out="${key}"]`);
      if (el === null) {
        continue;
      }
      const raw = inputs[key] ?? "";
      if (isFormula(raw)) {
        const v = computed[key];
        const text =
          v !== undefined ? formatValue(v) : "（未算出）";
        el.textContent = text || " ";
        el.classList.toggle("empty", text === "");
        el.classList.toggle("err", v !== undefined && isCellError(v));
      } else {
        el.textContent = " ";
        el.classList.add("empty");
        el.classList.remove("err");
      }
    }
  }
}

function setStatus(msg: string): void {
  const el = document.getElementById("status");
  if (el !== null) {
    el.textContent = msg;
  }
}

function fillSample(): void {
  const data: Record<string, string> = {
    A1: "10",
    A2: "20",
    A3: "30",
    B1: "=A1*2",
    B2: "=SUM(A1:A3)",
    C1: "=B1+B2",
    D1: "Hello",
    D2: '=D1&" "&"World"',
  };
  for (const [k, v] of Object.entries(data)) {
    const input = document.querySelector<HTMLInputElement>(
      `[data-cell="${k}"]`,
    );
    if (input !== null) {
      input.value = v;
    }
  }
}

renderSheet();

document.getElementById("btnRecalc")?.addEventListener("click", () => {
  const inputs = collectInputs();
  const computed = recalc(inputs);
  applyResults(inputs, computed);
  const nFormulas = Object.keys(computed).length;
  setStatus(`已计算（公式格 ${nFormulas} 个，最多迭代 40 轮）`);
});

document.getElementById("btnSample")?.addEventListener("click", () => {
  fillSample();
  setStatus("已填入示例，请点击「全部计算」");
});

setStatus("点击「全部计算」，或先「填入示例」");
