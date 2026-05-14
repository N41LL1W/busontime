import puppeteer, { type Browser } from "puppeteer";

async function runTest() {
  console.log("🚀 Iniciando teste do Puppeteer...");

  let browser: Browser | undefined;

  try {
    browser = await puppeteer.launch({
      headless: false, // GARANTE que a janela apareça
      slowMo: 50, // Deixa as ações um pouco mais lentas para podermos ver
      args: ["--start-maximized"], // Tenta abrir a janela maximizada
    });

    const page = await browser.newPage();

    console.log("🖥️  Navegador iniciado. Navegando para o Google...");
    await page.goto("https://www.google.com", { waitUntil: "networkidle2" });

    console.log("✅ Navegação para o Google concluída com sucesso!");
    console.log("---");
    console.log("👀 A janela do Chrome deve estar aberta agora.");
    console.log("🛑 Feche a janela manualmente para terminar o script.");
    console.log("---");

    // Mantém o navegador aberto até que seja fechado manualmente
    await new Promise<void>((resolve) => {
      browser?.once("disconnected", resolve);
    });
  } catch (error) {
    console.error("❌ Erro ao iniciar ou controlar o Puppeteer:", error);
  } finally {
    console.log("👋 Teste finalizado.");
  }
}

runTest();