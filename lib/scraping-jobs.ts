import { syncSchedules } from './database-sync';
import { scrapeRibeTransporte } from '../scrapers/cheerio-ribetransporte';
import { scrapeOcrFromImage } from '../scrapers/ocr-from-image';
import type { ScrapedHorario } from '../types/scrapers';

export type ScrapingJobResult = {
  id: string;
  label: string;
  status: 'success' | 'empty' | 'failed';
  count: number;
  error?: string;
};

type ScrapingJob = {
  id: string;
  label: string;
  scraper: () => Promise<ScrapedHorario[]>;
};

export const scrapingJobs: ScrapingJob[] = [
  {
    id: 'ribetransporte-rp-jardinopolis',
    label: 'Ribeirão Preto → Jardinópolis',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/', 'Ribeirão Preto', 'Jardinópolis'),
  },
  {
    id: 'ribetransporte-jardinopolis-rp',
    label: 'Jardinópolis → Ribeirão Preto',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/linha-01/', 'Jardinópolis', 'Ribeirão Preto'),
  },
  {
    id: 'vsb-barrinha-sertaozinho',
    label: 'Barrinha → Sertãozinho',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg', 'Barrinha', 'Sertãozinho'),
  },
  {
    id: 'vsb-batatais-altinopolis',
    label: 'Batatais → Altinópolis',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg', 'Batatais', 'Altinópolis'),
  },
  {
    id: 'vsb-brodowski-batatais',
    label: 'Brodowski → Batatais',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg', 'Brodowski', 'Batatais'),
  },
  {
    id: 'vsb-cachoerinha-ituverava',
    label: 'São Benedito da Cachoeirinha → Ituverava',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg', 'São Benedito da Cachoerinha', 'Ituverava'),
  },
  {
    id: 'vsb-miguelopolis-guaira',
    label: 'Miguelópolis → Guaíra',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Miguelópolis', 'Guaíra'),
  },
  {
    id: 'vsb-miguelopolis-barretos',
    label: 'Miguelópolis → Barretos',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Miguelópolis', 'Barretos'),
  },
  {
    id: 'vsb-guaira-barretos',
    label: 'Guaíra → Barretos',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Guaíra', 'Barretos'),
  },
  {
    id: 'vsb-miguelopolis-ituverava',
    label: 'Miguelópolis → Ituverava',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg', 'Miguelópolis', 'Ituverava'),
  },
  {
    id: 'vsb-ribeirao-altinopolis',
    label: 'Ribeirão Preto → Altinópolis',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg', 'Ribeirão Preto', 'Altinópolis'),
  },
  {
    id: 'vsb-ribeirao-barrinha',
    label: 'Ribeirão Preto → Barrinha',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg', 'Ribeirão Preto', 'Barrinha'),
  },
  {
    id: 'vsb-ribeirao-batatais',
    label: 'Ribeirão Preto → Batatais',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Batatais.jpg', 'Ribeirão Preto', 'Batatais'),
  },
  {
    id: 'vsb-ribeirao-brodowski',
    label: 'Ribeirão Preto → Brodowski',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg', 'Ribeirão Preto', 'Brodowski'),
  },
  {
    id: 'vsb-ribeirao-serra-azul',
    label: 'Ribeirão Preto → Serra Azul',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg', 'Ribeirão Preto', 'Serra Azul'),
  },
  {
    id: 'vsb-ribeirao-serrana',
    label: 'Ribeirão Preto → Serrana',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg', 'Ribeirão Preto', 'Serrana'),
  },
  {
    id: 'vsb-ribeirao-sertaozinho',
    label: 'Ribeirão Preto → Sertãozinho',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg', 'Ribeirão Preto', 'Sertãozinho'),
  },
];

export async function runScrapingJobs(jobIds?: string[]): Promise<ScrapingJobResult[]> {
  const jobs = jobIds?.length ? scrapingJobs.filter((job) => jobIds.includes(job.id)) : scrapingJobs;

  const results = await Promise.allSettled(
    jobs.map(async (job): Promise<ScrapingJobResult> => {
      console.log(`---▶️ Executando job: ${job.id} ---`);
      const scrapedData = await job.scraper();

      if (!scrapedData?.length) {
        return { id: job.id, label: job.label, status: 'empty', count: 0 };
      }

      await syncSchedules(job.id, scrapedData);
      return { id: job.id, label: job.label, status: 'success', count: scrapedData.length };
    })
  );

  return results.map((result, index) => {
    const job = jobs[index];

    if (result.status === 'fulfilled') {
      return result.value;
    }

    return {
      id: job.id,
      label: job.label,
      status: 'failed',
      count: 0,
      error: result.reason instanceof Error ? result.reason.message : 'Erro desconhecido na raspagem.',
    };
  });
}
