/** build 前把 pdfjs worker 复制进 public/（静态导出会带上，file:// 相对路径可加载） */
const fs = require('fs');
const path = require('path');

const root = __dirname;
const src = path.join(root, '..', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const dstDir = path.join(root, '..', 'public');
const dst = path.join(dstDir, 'pdf.worker.min.mjs');

fs.mkdirSync(dstDir, { recursive: true });
fs.copyFileSync(src, dst);
console.log('[copy-worker] pdf.worker.min.mjs → public/');
