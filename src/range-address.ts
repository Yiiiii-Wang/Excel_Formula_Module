/** A1 地址解析与区域展开（用于内存 mock 上下文） */

export function parseA1Address(address: string): { col: number; row: number } {
  const m = /^([A-Za-z]+)(\d+)$/.exec(address.trim());
  if (m === null) {
    throw new Error(`Invalid A1 address: ${address}`);
  }
  const colLetters = m[1];
  const rowDigits = m[2];
  if (colLetters === undefined || rowDigits === undefined) {
    throw new Error(`Invalid A1 address: ${address}`);
  }
  const col = lettersToCol(colLetters);
  const row = Number.parseInt(rowDigits, 10);
  if (!Number.isFinite(row) || row < 1) {
    throw new Error(`Invalid A1 address: ${address}`);
  }
  return { col, row };
}

export function lettersToCol(letters: string): number {
  let n = 0;
  for (const ch of letters.toUpperCase()) {
    if (ch < "A" || ch > "Z") {
      throw new Error(`Invalid column letters: ${letters}`);
    }
    n = n * 26 + (ch.charCodeAt(0) - 64);
  }
  return n;
}

export function colToLetters(col: number): string {
  let n = col;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function formatA1(col: number, row: number): string {
  return `${colToLetters(col)}${row}`;
}

/** 行优先展开矩形区域内的所有单元格地址 */
export function expandRangeAddresses(
  topLeft: string,
  bottomRight: string,
): string[] {
  const a = parseA1Address(topLeft);
  const b = parseA1Address(bottomRight);
  const c1 = Math.min(a.col, b.col);
  const c2 = Math.max(a.col, b.col);
  const r1 = Math.min(a.row, b.row);
  const r2 = Math.max(a.row, b.row);
  const out: string[] = [];
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) {
      out.push(formatA1(c, r));
    }
  }
  return out;
}
