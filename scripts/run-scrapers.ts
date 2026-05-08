// scripts/run-scrapers.ts
import prisma from '../lib/prisma';
import { runScrapingJobs, scrapingJobs } from '../lib/scraping-jobs';

async function main() {
  console.log('🚀 Iniciando processo de scraping e sincronização...');

  if (scrapingJobs.length === 0) {
    console.warn('⚠️ Nenhum job de scraping foi definido. O script não fará nada.');
    return;
  }

  const results = await runScrapingJobs();

  console.log('\n\n--- ✅ Resumo Final da Execução ---');
  results.forEach((result) => {
    if (result.status === 'success') {
      console.log(`[SUCESSO] Job '${result.id}' sincronizou ${result.count} horários.`);
    } else if (result.status === 'empty') {
      console.log(`[VAZIO]   Job '${result.id}' não encontrou horários para sincronizar.`);
    } else {
      console.error(`[FALHA]   Job '${result.id}' falhou. Erro: ${result.error}`);
    }
  });
}

main()
  .catch((e) => {
    console.error('\n🚨 Erro fatal no orquestrador de scraping:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🏁 Processo finalizado. Conexão com o Prisma fechada.');
  });
