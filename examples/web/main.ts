import { evaluate } from "../../src/api.ts";
import { findFormulaCellsWithCircularReference } from "../../src/circular-deps.ts";
import type { EvaluateContext } from "../../src/context-memory.ts";
import { expandRangeAddresses } from "../../src/range-address.ts";
import {
  cellError,
  type FormulaValue,
  formatErrorDisplay,
  isCellError,
} from "../../src/value.ts";
import { topologicalFormulaOrder } from "./topo-order.ts";

const COLS = 6;
const ROWS = 8;

const formulaBarEl = document.getElementById("formulaBar");
const nameBoxEl = document.getElementById("nameBox");

/** 当前选中的单元格（名称框 / 公式栏所对应的格子） */
let activeCellKey = "A1";

function isFormulaEditing(el: unknown): el is HTMLInputElement {
  return el instanceof HTMLInputElement && el.value.trimStart().startsWith("=");
}

/** 正在编辑公式的输入框：公式栏或格子内输入（须以 = 开头） */
function getFormulaEditor(): HTMLInputElement | null {
  const ae = document.activeElement;
  if (!(ae instanceof HTMLInputElement)) {
    return null;
  }
  if (ae.id === "formulaBar" && isFormulaEditing(ae)) {
    return ae;
  }
  if (ae.dataset.cell !== undefined && isFormulaEditing(ae)) {
    return ae;
  }
  return null;
}

function updateActiveHighlight(): void {
  for (const el of document.querySelectorAll(".cell-inner.is-active")) {
    el.classList.remove("is-active");
  }
  const input = document.querySelector<HTMLInputElement>(
    `[data-cell="${activeCellKey}"]`,
  );
  const inner = input?.closest(".cell-inner");
  inner?.classList.add("is-active");
}

function syncBarFromCell(key: string): void {
  const input = document.querySelector<HTMLInputElement>(
    `[data-cell="${key}"]`,
  );
  if (formulaBarEl instanceof HTMLInputElement && input !== null) {
    formulaBarEl.value = input.value;
  }
  if (nameBoxEl !== null) {
    nameBoxEl.textContent = key;
  }
}

function syncCellFromBar(): void {
  const input = document.querySelector<HTMLInputElement>(
    `[data-cell="${activeCellKey}"]`,
  );
  if (input !== null && formulaBarEl instanceof HTMLInputElement) {
    input.value = formulaBarEl.value;
  }
}

function setActiveCell(key: string): void {
  activeCellKey = key.toUpperCase();
  syncBarFromCell(activeCellKey);
  updateActiveHighlight();
}

function cellInputFromEventTarget(
  target: EventTarget | null,
): HTMLInputElement | null {
  if (!(target instanceof Element)) {
    return null;
  }
  const input = target.closest("td")?.querySelector("input[data-cell]");
  return input instanceof HTMLInputElement ? input : null;
}

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
    if (Object.hasOwn(computed, key)) {
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
  const formulaKeySet = new Set(formulaKeys);
  const circular = findFormulaCellsWithCircularReference(formulaKeySet, inputs);
  for (const key of circular) {
    computed[key] = cellError("CIRC", "循环引用");
  }

  const order = topologicalFormulaOrder(formulaKeys, inputs, circular);
  const active = formulaKeys.filter((k) => !circular.has(k));

  const evalOne = (key: string): void => {
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
  };

  if (order !== null) {
    for (const key of order) {
      evalOne(key);
    }
  } else {
    for (let p = 0; p < 10; p++) {
      for (const key of active) {
        evalOne(key);
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
        const text = v !== undefined ? formatValue(v) : "（未算出）";
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
  syncBarFromCell(activeCellKey);
}

function wireFormulaBar(): void {
  const sheet = document.getElementById("sheet");
  if (sheet === null || !(formulaBarEl instanceof HTMLInputElement)) {
    return;
  }

  sheet.addEventListener("focusin", (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.dataset.cell) {
      setActiveCell(t.dataset.cell);
    }
  });

  formulaBarEl.addEventListener("input", () => {
    syncCellFromBar();
  });

  sheet.addEventListener("input", (e) => {
    const t = e.target;
    if (
      t instanceof HTMLInputElement &&
      t.dataset.cell?.toUpperCase() === activeCellKey
    ) {
      syncBarFromCell(activeCellKey);
    }
  });

  sheet.addEventListener(
    "mousedown",
    (e) => {
      const editor = getFormulaEditor();
      if (editor === null) {
        return;
      }

      const hit = cellInputFromEventTarget(e.target);
      if (hit === null || !hit.dataset.cell) {
        return;
      }

      const refAddr = hit.dataset.cell.toUpperCase();
      e.preventDefault();
      e.stopPropagation();

      const start = editor.selectionStart ?? editor.value.length;
      const end = editor.selectionEnd ?? start;
      const v = editor.value;
      editor.value = `${v.slice(0, start)}${refAddr}${v.slice(end)}`;
      const pos = start + refAddr.length;
      editor.setSelectionRange(pos, pos);
      editor.focus();

      if (editor.id === "formulaBar") {
        syncCellFromBar();
      } else if (editor.dataset.cell) {
        syncBarFromCell(editor.dataset.cell.toUpperCase());
      }
    },
    true,
  );
}

renderSheet();
wireFormulaBar();
setActiveCell("A1");

document.getElementById("btnRecalc")?.addEventListener("click", () => {
  const inputs = collectInputs();
  const computed = recalc(inputs);
  applyResults(inputs, computed);
  const nFormulas = Object.keys(computed).length;
  const nCirc = [...Object.values(computed)].filter(
    (v) => isCellError(v) && v.code === "CIRC",
  ).length;
  const circHint = nCirc > 0 ? `，含循环引用 ${nCirc} 格（#CIRC!）` : "";
  setStatus(
    `已计算（公式格 ${nFormulas} 个；无环公式按拓扑顺序单遍求值${circHint}）`,
  );
});

document.getElementById("btnSample")?.addEventListener("click", () => {
  fillSample();
  setStatus("已填入示例，请点击「全部计算」");
});

setStatus("点击「全部计算」，或先「填入示例」");
