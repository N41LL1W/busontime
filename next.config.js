/** @type {import('next').NextConfig} */
const isStaticExport = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
};

module.exports = nextConfig;
