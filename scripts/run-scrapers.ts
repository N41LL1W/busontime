// scripts/run-scrapers.ts
import { syncSchedules } from '../lib/database-sync';
import prisma from '../lib/prisma';

// Importa apenas os scrapers que estão em uso
import { scrapeRibeTransporte } from '../scrapers/cheerio-ribetransporte';
import { scrapeOcrFromImage } from '../scrapers/ocr-from-image';

// Lista de todas as tarefas de scraping
const scrapingJobs = [
  // --- JOBS PARA RIBETRANSPORTE (COM CHEERIO) ---
  {
    id: 'ribetransporte-rp-jardinopolis',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/', 'Ribeirão Preto', 'Jardinópolis'),
  },
  {
    id: 'ribetransporte-jardinopolis-rp',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/linha-01/', 'Jardinópolis', 'Ribeirão Preto'),
  },

  // --- JOBS DE OCR (USANDO A FUNÇÃO INTELIGENTE) ---
  // Lembre-se de que a função agora tenta adivinhar o dia da semana e o sentido.
  {
    id: 'vsb-barrinha-sertaozinho',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg', 'Barrinha', 'Sertãozinho'),
  },
  {
    id: 'vsb-batatais-altinopolis',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg', 'Batatais', 'Altinópolis'),
  },
  {
    id: 'vsb-brodowski-batatais',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg', 'Brodowski', 'Batatais'),
  },
  {
    id: 'vsb-cachoerinha-ituverava',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg', 'São Benedito da Cachoerinha', 'Ituverava'),
  },
  {
    id: 'vsb-miguelopolis-guaira',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Miguelópolis', 'Guaíra'),
  },
  {
    id: 'vsb-miguelopolis-barretos',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Miguelópolis', 'Barretos'),
  },
  {
    id: 'vsb-guaira-barretos',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Guaíra', 'Barretos'),
  },
  {
    id: 'vsb-miguelopolis-ituverava',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg', 'Miguelópolis', 'Ituverava'),
  },
  {
    id: 'vsb-ribeirao-altinopolis',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg', 'Ribeirão Preto', 'Altinópolis'),
  },
  {
    id: 'vsb-ribeirao-barrinha',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg', 'Ribeirão Preto', 'Barrinha'),
  },
  {
    id: 'vsb-ribeirao-batatais',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Batatais.jpg', 'Ribeirão Preto', 'Batatais'),
  },
  {
    id: 'vsb-ribeirao-brodowski',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg', 'Ribeirão Preto', 'Brodowski'),
  },
  {
    id: 'vsb-ribeirao-serra-azul',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg', 'Ribeirão Preto', 'Serra Azul'),
  },
  {
    id: 'vsb-ribeirao-serrana',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg', 'Ribeirão Preto', 'Serrana'),
  },
  {
    id: 'vsb-ribeirao-sertaozinho',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg', 'Ribeirão Preto', 'Sertãozinho'),
  },
];

async function main() {
  console.log('🚀 Iniciando processo de scraping e sincronização...');

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
        // Descomente a linha abaixo quando estiver pronto para salvar os dados no banco
        // await syncSchedules(job.id, scrapedData);
      } else {
        console.log(`[${job.id}] Nenhum dado foi raspado ou erro na extração.`);
      }
    })
  );

  console.log('\n\n--- ✅ Resumo Final da Execução ---');
  results.forEach((result, index) => {
    const jobName = scrapingJobs[index].id;
    if (result.status === 'fulfilled') {
      console.log(`[SUCESSO] Job '${jobName}' concluído sem erros.`);
    } else {
      console.error(`[FALHA]   Job '${jobName}' falhou. Erro:`, result.reason);
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