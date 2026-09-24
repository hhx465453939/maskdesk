/** @type {import('next').NextConfig} */
const nextConfig = {
  // Electron 离线加载：静态导出，零服务端（SPEC ADR-1 / 纯前端约束）
  output: 'export',
  images: { unoptimized: true },
};

module.exports = nextConfig;
