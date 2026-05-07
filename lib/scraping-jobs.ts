import { scrapeCheerioJaboticabal } from "../scrapers/cheerio-jaboticabal";
import { scrapeRibeTransporte } from "../scrapers/cheerio-ribetransporte";
import { scrapeOcrFromImage } from "../scrapers/ocr-from-image";
import type { ScrapedHorario } from "../types/scrapers";

export type ScrapingJob = {
  /** Endpoint called by the admin UI, without the `/api/` prefix. */
  endpoint: string;
  /** Stable identifier used in sync/log messages. */
  id: string;
  label: string;
  /** Public URL used as the source for this scraping job. */
  sourceUrl: string;
  scraper: () => Promise<ScrapedHorario[]>;
};

function ocrJob(
  endpoint: string,
  id: string,
  label: string,
  sourceUrl: string,
  origem: string,
  destino: string
): ScrapingJob {
  return {
    endpoint,
    id,
    label,
    sourceUrl,
    scraper: () => scrapeOcrFromImage(sourceUrl, origem, destino),
  };
}

function cheerioJob(
  endpoint: string,
  id: string,
  label: string,
  sourceUrl: string,
  scraper: () => Promise<ScrapedHorario[]>
): ScrapingJob {
  return { endpoint, id, label, sourceUrl, scraper };
}

const jobs: ScrapingJob[] = [
  cheerioJob(
    "scrap-ribeirao-jardinopolis",
    "ribetransporte-rp-jardinopolis",
    "Ribeirão - Jardinópolis",
    "https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/",
    () =>
      scrapeRibeTransporte(
        "https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/",
        "Ribeirão Preto",
        "Jardinópolis"
      )
  ),
  cheerioJob(
    "scrap-jardinopolis-ribeirao",
    "ribetransporte-jardinopolis-rp",
    "Jardinópolis - Ribeirão",
    "https://www.ribetransporte.com.br/linha-01/",
    () =>
      scrapeRibeTransporte(
        "https://www.ribetransporte.com.br/linha-01/",
        "Jardinópolis",
        "Ribeirão Preto"
      )
  ),
  ocrJob(
    "scrap-ribeirao-brodowski",
    "vsb-ribeirao-brodowski",
    "Ribeirão - Brodowski",
    "https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg",
    "Ribeirão Preto",
    "Brodowski"
  ),
  ocrJob(
    "scrap-brodowski-batatais",
    "vsb-brodowski-batatais",
    "Brodowski - Batatais",
    "https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg",
    "Brodowski",
    "Batatais"
  ),
  ocrJob(
    "scrap-ribeirao-sertaozinho",
    "vsb-ribeirao-sertaozinho",
    "Ribeirão - Sertãozinho",
    "https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg",
    "Ribeirão Preto",
    "Sertãozinho"
  ),
  ocrJob(
    "scrap-ribeirao-serrana",
    "vsb-ribeirao-serrana",
    "Ribeirão - Serrana",
    "https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg",
    "Ribeirão Preto",
    "Serrana"
  ),
  ocrJob(
    "scrap-ribeirao-serra-azul",
    "vsb-ribeirao-serra-azul",
    "Ribeirão - Serra Azul",
    "https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg",
    "Ribeirão Preto",
    "Serra Azul"
  ),
  ocrJob(
    "scrap-ribeirao-batatais",
    "vsb-ribeirao-batatais",
    "Ribeirão - Batatais",
    "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Batatais.jpg",
    "Ribeirão Preto",
    "Batatais"
  ),
  ocrJob(
    "scrap-ribeirao-barrinha",
    "vsb-ribeirao-barrinha",
    "Ribeirão - Barrinha",
    "https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg",
    "Ribeirão Preto",
    "Barrinha"
  ),
  ocrJob(
    "scrap-ribeirao-altinopolis",
    "vsb-ribeirao-altinopolis",
    "Ribeirão - Altinópolis",
    "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg",
    "Ribeirão Preto",
    "Altinópolis"
  ),
  ocrJob(
    "scrap-barrinha-sertaozinho",
    "vsb-barrinha-sertaozinho",
    "Barrinha - Sertãozinho",
    "https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg",
    "Barrinha",
    "Sertãozinho"
  ),
  ocrJob(
    "scrap-batatais-altinopolis",
    "vsb-batatais-altinopolis",
    "Batatais - Altinópolis",
    "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg",
    "Batatais",
    "Altinópolis"
  ),
  ocrJob(
    "scrap-miguelopolis-ituverava",
    "vsb-miguelopolis-ituverava",
    "Miguelópolis - Ituverava",
    "https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg",
    "Miguelópolis",
    "Ituverava"
  ),
  ocrJob(
    "scrap-cachoeirinha-ituverava",
    "vsb-cachoeirinha-ituverava",
    "São Benedito - Ituverava",
    "https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg",
    "São Benedito da Cachoeirinha",
    "Ituverava"
  ),
  ocrJob(
    "scrap-miguelopolis-barretos",
    "vsb-miguelopolis-barretos",
    "Miguelópolis - Barretos",
    "https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg",
    "Miguelópolis",
    "Barretos"
  ),
  cheerioJob(
    "scrap-jaboticabal",
    "jaboticabal-cheerio",
    "Saída de Jaboticabal",
    "https://www.jaboticabal.sp.gov.br/horario-de-onibus",
    () =>
      scrapeCheerioJaboticabal(
        "https://www.jaboticabal.sp.gov.br/horario-de-onibus",
        "Jaboticabal"
      )
  ),
];

const aliases: Record<string, string> = {
  "scrap-cachoerinha-ituverava": "scrap-cachoeirinha-ituverava",
  "scrap-miguelopolis-baretos": "scrap-miguelopolis-barretos",
};

export const scrapingJobs = jobs;

export const scrapingJobsByEndpoint = new Map(
  jobs.flatMap((job) => {
    const entries: Array<[string, ScrapingJob]> = [[job.endpoint, job]];
    Object.entries(aliases).forEach(([alias, endpoint]) => {
      if (endpoint === job.endpoint) {
        entries.push([alias, job]);
      }
    });
    return entries;
  })
);

export function getScrapingJob(endpoint: string) {
  return scrapingJobsByEndpoint.get(endpoint);
}