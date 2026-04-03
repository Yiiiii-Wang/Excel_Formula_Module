/**
 * 命令行演示：请先 `npm run build`，再 `npm run demo`。
 * 也可在项目根执行：`node examples/demo.mjs`（需已存在 dist/）。
 */
import {
  createMemoryContext,
  evaluate,
  extractDependencies,
  formatErrorDisplay,
  isCellError,
} from "../dist/index.js";

function printResult(label, formula, ctx) {
  const r = evaluate(formula, ctx);
  console.log(`\n${label}`);
  console.log(`  公式: ${formula}`);
  if (r.ok) {
    const v = r.value;
    const display = isCellError(v) ? formatErrorDisplay(v) : JSON.stringify(v);
    console.log(`  结果: ${display}`);
  } else {
    console.log(`  失败: [${r.error.kind}] ${r.error.message}`);
  }
}

console.log("═".repeat(56));
console.log(" Excel-style formula engine — CLI demo ");
console.log("═".repeat(56));

printResult("纯字面量与运算", "=1+2*3");

printResult("函数嵌套", "=SUM(1, SUM(2, 3))");

const grid = createMemoryContext({
  A1: 10,
  A2: 20,
  B1: 5,
});
printResult("引用内存格子 + 区域求和", "=A1+A2+SUM(A1:A2)", grid);

printResult("除零错误（仍为 ok: true）", "=1/0");

printResult("语法错误（ok: false）", "=1++");

const depFormula = "=SUM(A1:A2)+B1";
console.log("\n依赖分析");
console.log(`  公式: ${depFormula}`);
console.log(
  `  单元格: ${JSON.stringify([...extractDependencies(depFormula)])}`,
);

console.log(`\n${"═".repeat(56)}`);
console.log(" Demo 结束 ");
console.log(`${"═".repeat(56)}\n`);
