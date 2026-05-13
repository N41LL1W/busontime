import { syncSchedules } from './database-sync';
import { scrapeRibeTransporte } from '../scrapers/cheerio-ribetransporte';
import { scrapeOcrFromImage } from '../scrapers/ocr-from-image';
import { SEMIURBANO_APP_URL, scrapeSemiurbanoRoute } from '../scrapers/cheerio-semiurbano';
import type { ScrapedHorario } from '../types/scrapers';

export type ScrapingJobResult = {
  id: string;
  label: string;
  status: 'success' | 'empty' | 'failed';
  count: number;
  error?: string;
};

export type ScrapingJob = {
  id: string;
  endpoint: string;
  label: string;
  sourceUrl: string;
  scraper: () => Promise<ScrapedHorario[]>;
};


const semiurbanoRouteJobs: ScrapingJob[] = [
  {
    id: 'semiurbano-ribeirao-brodowski',
    endpoint: 'scrap-ribeirao-brodowski',
    label: 'Ribeirão Preto → Brodowski',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Ribeirão Preto', destino: 'Brodowski', label: 'Ribeirão - Brodowski' }),
  },
  {
    id: 'semiurbano-brodowski-batatais',
    endpoint: 'scrap-brodowski-batatais',
    label: 'Brodowski → Batatais',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Brodowski', destino: 'Batatais', label: 'Brodowski - Batatais' }),
  },
  {
    id: 'semiurbano-ribeirao-sertaozinho',
    endpoint: 'scrap-ribeirao-sertaozinho',
    label: 'Ribeirão Preto → Sertãozinho',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Ribeirão Preto', destino: 'Sertãozinho', label: 'Ribeirão - Sertãozinho' }),
  },
  {
    id: 'semiurbano-ribeirao-serrana',
    endpoint: 'scrap-ribeirao-serrana',
    label: 'Ribeirão Preto → Serrana',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Ribeirão Preto', destino: 'Serrana', label: 'Ribeirão - Serrana' }),
  },
  {
    id: 'semiurbano-ribeirao-serra-azul',
    endpoint: 'scrap-ribeirao-serra-azul',
    label: 'Ribeirão Preto → Serra Azul',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Ribeirão Preto', destino: 'Serra Azul', label: 'Ribeirão - Serra Azul' }),
  },
  {
    id: 'semiurbano-ribeirao-batatais',
    endpoint: 'scrap-ribeirao-batatais',
    label: 'Ribeirão Preto → Batatais',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Ribeirão Preto', destino: 'Batatais', label: 'Ribeirão - Batatais' }),
  },
  {
    id: 'semiurbano-ribeirao-barrinha',
    endpoint: 'scrap-ribeirao-barrinha',
    label: 'Ribeirão Preto → Barrinha',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Ribeirão Preto', destino: 'Barrinha', label: 'Ribeirão - Barrinha' }),
  },
  {
    id: 'semiurbano-ribeirao-altinopolis',
    endpoint: 'scrap-ribeirao-altinopolis',
    label: 'Ribeirão Preto → Altinópolis',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Ribeirão Preto', destino: 'Altinópolis', label: 'Ribeirão - Altinópolis' }),
  },
  {
    id: 'semiurbano-barrinha-sertaozinho',
    endpoint: 'scrap-barrinha-sertaozinho',
    label: 'Barrinha → Sertãozinho',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Barrinha', destino: 'Sertãozinho', label: 'Barrinha - Sertãozinho' }),
  },
  {
    id: 'semiurbano-batatais-altinopolis',
    endpoint: 'scrap-batatais-altinopolis',
    label: 'Batatais → Altinópolis',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Batatais', destino: 'Altinópolis', label: 'Batatais - Altinópolis' }),
  },
  {
    id: 'semiurbano-miguelopolis-ituverava',
    endpoint: 'scrap-miguelopolis-ituverava',
    label: 'Miguelópolis → Ituverava',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Miguelópolis', destino: 'Ituverava', label: 'Miguelópolis - Ituverava' }),
  },
  {
    id: 'semiurbano-cachoeirinha-ituverava',
    endpoint: 'scrap-cachoeirinha-ituverava',
    label: 'São Benedito da Cachoeirinha → Ituverava',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'São Benedito da Cachoeirinha', destino: 'Ituverava', label: 'São Benedito - Ituverava' }),
  },
  {
    id: 'semiurbano-miguelopolis-barretos',
    endpoint: 'scrap-miguelopolis-barretos',
    label: 'Miguelópolis → Barretos',
    sourceUrl: SEMIURBANO_APP_URL,
    scraper: () => scrapeSemiurbanoRoute({ origem: 'Miguelópolis', destino: 'Barretos', label: 'Miguelópolis - Barretos' }),
  },
];

export const scrapingJobs: ScrapingJob[] = [
  ...semiurbanoRouteJobs,
  {
    id: 'ribetransporte-rp-jardinopolis',
    endpoint: 'ribetransporte-rp-jardinopolis',
    label: 'Ribeirão Preto → Jardinópolis',
    sourceUrl: 'https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/', 'Ribeirão Preto', 'Jardinópolis'),
  },
  {
    id: 'ribetransporte-jardinopolis-rp',
    endpoint: 'ribetransporte-jardinopolis-rp',
    label: 'Jardinópolis → Ribeirão Preto',
    sourceUrl: 'https://www.ribetransporte.com.br/linha-01/',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/linha-01/', 'Jardinópolis', 'Ribeirão Preto'),
  },
  {
    id: 'vsb-barrinha-sertaozinho',
    endpoint: 'vsb-barrinha-sertaozinho',
    label: 'Barrinha → Sertãozinho',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg', 'Barrinha', 'Sertãozinho'),
  },
  {
    id: 'vsb-batatais-altinopolis',
    endpoint: 'vsb-batatais-altinopolis',
    label: 'Batatais → Altinópolis',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg', 'Batatais', 'Altinópolis'),
  },
  {
    id: 'vsb-brodowski-batatais',
    endpoint: 'vsb-brodowski-batatais',
    label: 'Brodowski → Batatais',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg', 'Brodowski', 'Batatais'),
  },
  {
    id: 'vsb-cachoerinha-ituverava',
    endpoint: 'vsb-cachoerinha-ituverava',
    label: 'São Benedito da Cachoeirinha → Ituverava',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg', 'São Benedito da Cachoerinha', 'Ituverava'),
  },
  {
    id: 'vsb-miguelopolis-guaira',
    endpoint: 'vsb-miguelopolis-guaira',
    label: 'Miguelópolis → Guaíra',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Miguelópolis', 'Guaíra'),
  },
  {
    id: 'vsb-miguelopolis-barretos',
    endpoint: 'vsb-miguelopolis-barretos',
    label: 'Miguelópolis → Barretos',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Miguelópolis', 'Barretos'),
  },
  {
    id: 'vsb-guaira-barretos',
    endpoint: 'vsb-guaira-barretos',
    label: 'Guaíra → Barretos',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Guaíra', 'Barretos'),
  },
  {
    id: 'vsb-miguelopolis-ituverava',
    endpoint: 'vsb-miguelopolis-ituverava',
    label: 'Miguelópolis → Ituverava',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg', 'Miguelópolis', 'Ituverava'),
  },
  {
    id: 'vsb-ribeirao-altinopolis',
    endpoint: 'vsb-ribeirao-altinopolis',
    label: 'Ribeirão Preto → Altinópolis',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg', 'Ribeirão Preto', 'Altinópolis'),
  },
  {
    id: 'vsb-ribeirao-barrinha',
    endpoint: 'vsb-ribeirao-barrinha',
    label: 'Ribeirão Preto → Barrinha',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg', 'Ribeirão Preto', 'Barrinha'),
  },
  {
    id: 'vsb-ribeirao-batatais',
    endpoint: 'vsb-ribeirao-batatais',
    label: 'Ribeirão Preto → Batatais',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Batatais.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Batatais.jpg', 'Ribeirão Preto', 'Batatais'),
  },
  {
    id: 'vsb-ribeirao-brodowski',
    endpoint: 'vsb-ribeirao-brodowski',
    label: 'Ribeirão Preto → Brodowski',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg', 'Ribeirão Preto', 'Brodowski'),
  },
  {
    id: 'vsb-ribeirao-serra-azul',
    endpoint: 'vsb-ribeirao-serra-azul',
    label: 'Ribeirão Preto → Serra Azul',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg', 'Ribeirão Preto', 'Serra Azul'),
  },
  {
    id: 'vsb-ribeirao-serrana',
    endpoint: 'vsb-ribeirao-serrana',
    label: 'Ribeirão Preto → Serrana',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg', 'Ribeirão Preto', 'Serrana'),
  },
  {
    id: 'vsb-ribeirao-sertaozinho',
    endpoint: 'vsb-ribeirao-sertaozinho',
    label: 'Ribeirão Preto → Sertãozinho',
    sourceUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg', 'Ribeirão Preto', 'Sertãozinho'),
  },
];

export function getScrapingJob(endpoint: string): ScrapingJob | undefined {
  return scrapingJobs.find((job) => job.endpoint === endpoint || job.id === endpoint);
}

const legacySemiurbanoFallbacks: Record<string, string> = {
  'semiurbano-cachoeirinha-ituverava': 'vsb-cachoerinha-ituverava',
};

export function getLegacySemiurbanoFallbackJob(job: ScrapingJob): ScrapingJob | undefined {
  if (!job.id.startsWith('semiurbano-')) return undefined;

  const fallbackId =
    legacySemiurbanoFallbacks[job.id] || job.id.replace('semiurbano-', 'vsb-');

  return scrapingJobs.find((candidate) => candidate.id === fallbackId);
}

export async function runScrapingJobs(jobIds?: string[]): Promise<ScrapingJobResult[]> {
  const jobs = jobIds?.length ? scrapingJobs.filter((job) => jobIds.includes(job.id)) : scrapingJobs;
  const results: ScrapingJobResult[] = [];

  for (const job of jobs) {
    try {
      console.log(`---▶️ Executando job: ${job.id} ---`);
      let scrapedData = await job.scraper();

      if (!scrapedData?.length) {
        const fallbackJob = getLegacySemiurbanoFallbackJob(job);

        if (fallbackJob) {
          console.warn(
            `[${job.id}] Fonte atual não retornou horários. Tentando fallback legado ${fallbackJob.id}.`,
          );
          scrapedData = await fallbackJob.scraper();
        }
      }

      if (!scrapedData?.length) {
        results.push({ id: job.id, label: job.label, status: 'empty', count: 0 });
        continue;
      }

      await syncSchedules(job.id, scrapedData);
      results.push({ id: job.id, label: job.label, status: 'success', count: scrapedData.length });
    } catch (error) {
      results.push({
        id: job.id,
        label: job.label,
        status: 'failed',
        count: 0,
        error: error instanceof Error ? error.message : 'Erro desconhecido na raspagem.',
      });
    }
  }

return results;
}
