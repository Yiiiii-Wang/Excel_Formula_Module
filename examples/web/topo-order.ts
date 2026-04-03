import { extractDependencies } from "../../src/dependencies.ts";

/**
 * 无环时：按依赖顺序排列公式格（被引用者先于引用者）。
 * 若仍有环（不应在已剔除 CIRC 后发生），返回 null。
 */
export function topologicalFormulaOrder(
  formulaKeys: readonly string[],
  inputs: Readonly<Record<string, string>>,
  circular: ReadonlySet<string>,
): string[] | null {
  const active = formulaKeys.filter((k) => !circular.has(k));
  const activeSet = new Set(active);
  const indegree = new Map<string, number>();
  const succ = new Map<string, string[]>();

  for (const f of active) {
    indegree.set(f, 0);
  }

  for (const f of active) {
    const deps = extractDependencies(inputs[f] ?? "").filter((d) =>
      activeSet.has(d),
    );
    indegree.set(f, deps.length);
    for (const d of deps) {
      const list = succ.get(d);
      if (list === undefined) {
        succ.set(d, [f]);
      } else {
        list.push(f);
      }
    }
  }

  const queue = active.filter((f) => (indegree.get(f) ?? 0) === 0);
  const order: string[] = [];

  while (queue.length > 0) {
    const d = queue.shift();
    if (d === undefined) {
      break;
    }
    order.push(d);
    for (const f of succ.get(d) ?? []) {
      const next = (indegree.get(f) ?? 0) - 1;
      indegree.set(f, next);
      if (next === 0) {
        queue.push(f);
      }
    }
  }

  if (order.length !== active.length) {
    return null;
  }
  return order;
}
