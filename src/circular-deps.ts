import { extractDependencies } from "./dependencies.js";

/**
 * 根据当前表内公式格与公式文本，找出「直接或间接」因循环引用应报错的公式格地址（大写 A1）。
 *
 * 1. 在「公式格 → 其 extractDependencies 展开后的单元格」子图上做 Tarjan，找出含环的强连通分量；
 * 2. 自环（如 `=B2+B7` 写在 B2）算作循环；
 * 3. 再沿依赖边向后传播：任何引用到已标记格的公式格一并标记（与 Excel 中依赖环上单元格的表现一致）。
 */
export function findFormulaCellsWithCircularReference(
  formulaKeys: ReadonlySet<string>,
  inputs: Readonly<Record<string, string>>,
): Set<string> {
  const graph = new Map<string, readonly string[]>();
  for (const f of formulaKeys) {
    const raw = inputs[f] ?? "";
    graph.set(f, extractDependencies(raw));
  }

  const inCycle = tarjanCircularFormulaNodes(formulaKeys, graph);
  return propagateCircularToDependents(formulaKeys, graph, inCycle);
}

function tarjanCircularFormulaNodes(
  formulaKeys: ReadonlySet<string>,
  graph: ReadonlyMap<string, readonly string[]>,
): Set<string> {
  let idx = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const index = new Map<string, number>();
  const lowlink = new Map<string, number>();
  const circular = new Set<string>();

  function strongConnect(v: string): void {
    index.set(v, idx);
    lowlink.set(v, idx);
    idx += 1;
    stack.push(v);
    onStack.add(v);

    for (const w of graph.get(v) ?? []) {
      if (!formulaKeys.has(w)) {
        continue;
      }
      if (!index.has(w)) {
        strongConnect(w);
        lowlink.set(v, Math.min(lowlink.get(v)!, lowlink.get(w)!));
      } else if (onStack.has(w)) {
        lowlink.set(v, Math.min(lowlink.get(v)!, index.get(w)!));
      }
    }

    if (lowlink.get(v) === index.get(v)) {
      const comp: string[] = [];
      while (true) {
        const w = stack.pop();
        if (w === undefined) {
          break;
        }
        onStack.delete(w);
        comp.push(w);
        if (w === v) {
          break;
        }
      }
      if (comp.length > 1) {
        for (const x of comp) {
          circular.add(x);
        }
      } else if (comp.length === 1) {
        const x = comp[0]!;
        const outs = graph.get(x) ?? [];
        if (outs.includes(x)) {
          circular.add(x);
        }
      }
    }
  }

  for (const v of formulaKeys) {
    if (!index.has(v)) {
      strongConnect(v);
    }
  }

  return circular;
}

function propagateCircularToDependents(
  formulaKeys: ReadonlySet<string>,
  graph: ReadonlyMap<string, readonly string[]>,
  seeds: ReadonlySet<string>,
): Set<string> {
  const bad = new Set(seeds);
  let changed = true;
  while (changed) {
    changed = false;
    for (const f of formulaKeys) {
      if (bad.has(f)) {
        continue;
      }
      for (const d of graph.get(f) ?? []) {
        if (bad.has(d)) {
          bad.add(f);
          changed = true;
          break;
        }
      }
    }
  }
  return bad;
}
