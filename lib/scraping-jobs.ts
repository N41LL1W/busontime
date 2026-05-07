import { syncSchedules } from './database-sync';
import { scrapeCheerioJaboticabal } from '../scrapers/cheerio-jaboticabal';
import { scrapeRibeTransporte } from '../scrapers/cheerio-ribetransporte';
import { scrapeSaoBentoSemiurbano } from '../scrapers/sao-bento-semiurbano';
import type { ScrapedHorario } from '../types/scrapers';

export type ScrapingJob = {
  id: string;
  label: string;
  provider: 'RibeTransporte' | 'São Bento' | 'Jaboticabal';
  scraper: () => Promise<ScrapedHorario[]>;
};

export const scrapingJobs: ScrapingJob[] = [
  {
    id: 'ribetransporte-rp-jardinopolis',
    label: 'Ribeirão Preto → Jardinópolis',
    provider: 'RibeTransporte',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/', 'Ribeirão Preto', 'Jardinópolis'),
  },
  {
    id: 'ribetransporte-jardinopolis-rp',
    label: 'Jardinópolis → Ribeirão Preto',
    provider: 'RibeTransporte',
    scraper: () => scrapeRibeTransporte('https://www.ribetransporte.com.br/linha-01/', 'Jardinópolis', 'Ribeirão Preto'),
  },
  {
    id: 'jaboticabal-saidas',
    label: 'Saídas de Jaboticabal',
    provider: 'Jaboticabal',
    scraper: () => scrapeCheerioJaboticabal('https://www.expressoitamarati.com.br/horarios-de-onibus/jaboticabal', 'Jaboticabal'),
  },
  {
    id: 'sao-bento-semiurbano',
    label: 'Viação São Bento - todos os semiurbanos',
    provider: 'São Bento',
    scraper: () => scrapeSaoBentoSemiurbano(),
  },
];

export function getScrapingJob(jobId: string) {
  return scrapingJobs.find((job) => job.id === jobId);
}

export async function runScrapingJob(job: ScrapingJob) {
  const scrapedData = await job.scraper();

  if (!scrapedData.length) {
    return { jobId: job.id, label: job.label, scraped: 0, synced: false };
  }

  await syncSchedules(job.id, scrapedData);
  return { jobId: job.id, label: job.label, scraped: scrapedData.length, synced: true };
}

export async function runAllScrapingJobs() {
  const results = [];

  for (const job of scrapingJobs) {
    results.push(await runScrapingJob(job));
  }

  return results;
}
