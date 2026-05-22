/**
 * chrome-launcher.ts
 * Coloque em: scrapers/chrome-launcher.ts
 */

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const LOCAL_CHROME_CACHE_DIR = join(process.cwd(), ".cache", "puppeteer", "chrome");
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

function findLocalChrome(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  if (process.env.CHROME_EXECUTABLE_PATH) return process.env.CHROME_EXECUTABLE_PATH;
  if (!existsSync(LOCAL_CHROME_CACHE_DIR)) return undefined;

  const platformDirs = readdirSync(LOCAL_CHROME_CACHE_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()
    .reverse();

  for (const dir of platformDirs) {
    const linux = join(LOCAL_CHROME_CACHE_DIR, dir, "chrome-linux64", "chrome");
    if (existsSync(linux)) return linux;
    const win = join(LOCAL_CHROME_CACHE_DIR, dir, "chrome-win64", "chrome.exe");
    if (existsSync(win)) return win;
  }
  return undefined;
}

const BASE_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-zygote",
  "--single-process",
];

// Retorna `any` para evitar conflito entre tipos de puppeteer vs puppeteer-core
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function launchBrowser(): Promise<any> {
  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const { launch } = (await import("puppeteer-core")).default;

    const executablePath = await chromium.executablePath();

    return launch({
      args: [...(chromium.args ?? []), ...BASE_ARGS],
      executablePath,
      headless: true,
    });
  }

  // Local
  const { default: puppeteer } = await import("puppeteer");
  return puppeteer.launch({
    headless: true,
    executablePath: findLocalChrome(),
    args: BASE_ARGS,
  });
}
