import { syncSchedules } from "../lib/database-sync";
import prisma from "../lib/prisma";
import { scrapingJobs } from "../lib/scraping-jobs";

async function main() {
  console.log("🚀 Iniciando processo de scraping e sincronização...");

  if (scrapingJobs.length === 0) {
    console.warn("⚠️ Nenhum job de scraping foi definido. O script não fará nada.");
    return;
  }

  const results = await Promise.allSettled(
    scrapingJobs.map(async (job) => {
      console.log(`\n---▶️  Executando job: ${job.id} ---`);

      const scrapedData = await job.scraper();

      if (scrapedData && scrapedData.length > 0) {
        console.log(`[${job.id}] Dados raspados, pronto para sincronizar.`);
        await syncSchedules(job.id, scrapedData);
      } else {
        console.log(`[${job.id}] Nenhum dado foi raspado ou erro na extração.`);
      }
    })
  );

  console.log("\n\n--- ✅ Resumo Final da Execução ---");
  results.forEach((result, index) => {
    const jobName = scrapingJobs[index].id;
    if (result.status === "fulfilled") {
      console.log(`[SUCESSO] Job '${jobName}' concluído sem erros.`);
    } else {
      console.error(`[FALHA]   Job '${jobName}' falhou. Erro:`, result.reason);
    }
  });
}

main()
  .catch((e) => {
    console.error("\n🚨 Erro fatal no orquestrador de scraping:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("\n🏁 Processo finalizado. Conexão com o Prisma fechada.");
  });