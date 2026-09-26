/** @type {import('next').NextConfig} */
const nextConfig = {
  // Electron 离线加载：静态导出，零服务端（SPEC ADR-1 / 纯前端约束）
  output: 'export',
  images: { unoptimized: true },
  // file:// 协议加载时资源必须相对路径：绝对路径 /_next/* 会被解析到磁盘根目录导致全量 404 白屏
  assetPrefix: './',
};

module.exports = nextConfig;
