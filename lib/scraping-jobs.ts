import { syncSchedules } from './database-sync';
import { scrapeRibeTransporte } from '../scrapers/cheerio-ribetransporte';
import { scrapeOcrFromImage } from '../scrapers/ocr-from-image';
import { scrapeCheerioJaboticabal } from '../scrapers/cheerio-jaboticabal';
import type { ScrapedHorario } from '../types/scrapers';

export type ScrapingJob = {
  id: string;
  label: string;
  scraper: () => Promise<ScrapedHorario[]>;
};

export const scrapingJobs: ScrapingJob[] = [
  {
    id: 'scrap-ribeirao-jardinopolis',
    label: 'Ribeirão Preto - Jardinópolis',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/', 'Ribeirão Preto', 'Jardinópolis'),
  },
  {
    id: 'scrap-jardinopolis-ribeirao',
    label: 'Jardinópolis - Ribeirão Preto',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/linha-01/', 'Jardinópolis', 'Ribeirão Preto'),
  },
  {
    id: 'scrap-barrinha-sertaozinho',
    label: 'Barrinha - Sertãozinho',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg', 'Barrinha', 'Sertãozinho'),
  },
  {
    id: 'scrap-batatais-altinopolis',
    label: 'Batatais - Altinópolis',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg', 'Batatais', 'Altinópolis'),
  },
  {
    id: 'scrap-brodowski-batatais',
    label: 'Brodowski - Batatais',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg', 'Brodowski', 'Batatais'),
  },
  {
    id: 'scrap-cachoerinha-ituverava',
    label: 'São Benedito da Cachoeirinha - Ituverava',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg', 'São Benedito da Cachoerinha', 'Ituverava'),
  },
  {
    id: 'scrap-miguelopolis-guaira',
    label: 'Miguelópolis - Guaíra',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Miguelópolis', 'Guaíra'),
  },
  {
    id: 'scrap-miguelopolis-barretos',
    label: 'Miguelópolis - Barretos',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Miguelópolis', 'Barretos'),
  },
  {
    id: 'scrap-guaira-barretos',
    label: 'Guaíra - Barretos',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg', 'Guaíra', 'Barretos'),
  },
  {
    id: 'scrap-miguelopolis-ituverava',
    label: 'Miguelópolis - Ituverava',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg', 'Miguelópolis', 'Ituverava'),
  },
  {
    id: 'scrap-ribeirao-altinopolis',
    label: 'Ribeirão Preto - Altinópolis',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg', 'Ribeirão Preto', 'Altinópolis'),
  },
  {
    id: 'scrap-ribeirao-barrinha',
    label: 'Ribeirão Preto - Barrinha',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg', 'Ribeirão Preto', 'Barrinha'),
  },
  {
    id: 'scrap-ribeirao-batatais',
    label: 'Ribeirão Preto - Batatais',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Batatais.jpg', 'Ribeirão Preto', 'Batatais'),
  },
  {
    id: 'scrap-ribeirao-brodowski',
    label: 'Ribeirão Preto - Brodowski',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg', 'Ribeirão Preto', 'Brodowski'),
  },
  {
    id: 'scrap-ribeirao-serra-azul',
    label: 'Ribeirão Preto - Serra Azul',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg', 'Ribeirão Preto', 'Serra Azul'),
  },
  {
    id: 'scrap-ribeirao-serrana',
    label: 'Ribeirão Preto - Serrana',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg', 'Ribeirão Preto', 'Serrana'),
  },
  {
    id: 'scrap-ribeirao-sertaozinho',
    label: 'Ribeirão Preto - Sertãozinho',
    scraper: () => scrapeOcrFromImage('https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg', 'Ribeirão Preto', 'Sertãozinho'),
  },
  {
    id: 'scrap-jaboticabal',
    label: 'Saída de Jaboticabal',
    scraper: () => scrapeCheerioJaboticabal('https://www.jaboticabal.sp.gov.br/horario-de-onibus', 'Jaboticabal'),
  },
];

export async function runScrapingJob(job: ScrapingJob) {
  const scrapedData = await job.scraper();

  if (!scrapedData || scrapedData.length === 0) {
    return { id: job.id, label: job.label, scraped: 0, synced: false };
  }

  await syncSchedules(job.id, scrapedData);

  return { id: job.id, label: job.label, scraped: scrapedData.length, synced: true };
}
