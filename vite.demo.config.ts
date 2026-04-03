import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

/** 仓库根目录（允许 dev server 读取 ../../src） */
const repoRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(repoRoot, "examples/web"),
  server: {
    port: 5173,
    open: true,
    fs: {
      allow: [repoRoot],
    },
  },
});
