/** @type {import('next').NextConfig} */
const isStaticExport = process.env.CAPACITOR_BUILD === 'true';

const nextConfig = {
  ...(isStaticExport ? { output: 'export' } : {}),
    outputFileTracingIncludes: {
    '/api/teste-semiurbano': ['./.cache/puppeteer/**/*', './.puppeteerrc.cjs'],
    '/api/*': ['./.cache/puppeteer/**/*', './.puppeteerrc.cjs'],
  },
};

module.exports = nextConfig;
