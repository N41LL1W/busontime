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
  scraper: () => Promise<ScrapedHorario[]>;
};

const jobs: ScrapingJob[] = [
  {
    endpoint: "scrap-ribeirao-jardinopolis",
    id: "ribetransporte-rp-jardinopolis",
    label: "Ribeirão - Jardinópolis",
    scraper: () => scrapeRibeTransporte("https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/", "Ribeirão Preto", "Jardinópolis"),
  },
  {
    endpoint: "scrap-jardinopolis-ribeirao",
    id: "ribetransporte-jardinopolis-rp",
    label: "Jardinópolis - Ribeirão",
    scraper: () => scrapeRibeTransporte("https://www.ribetransporte.com.br/linha-01/", "Jardinópolis", "Ribeirão Preto"),
  },
  {
    endpoint: "scrap-ribeirao-brodowski",
    id: "vsb-ribeirao-brodowski",
    label: "Ribeirão - Brodowski",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg", "Ribeirão Preto", "Brodowski"),
  },
  {
    endpoint: "scrap-brodowski-batatais",
    id: "vsb-brodowski-batatais",
    label: "Brodowski - Batatais",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg", "Brodowski", "Batatais"),
  },
  {
    endpoint: "scrap-ribeirao-sertaozinho",
    id: "vsb-ribeirao-sertaozinho",
    label: "Ribeirão - Sertãozinho",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg", "Ribeirão Preto", "Sertãozinho"),
  },
  {
    endpoint: "scrap-ribeirao-serrana",
    id: "vsb-ribeirao-serrana",
    label: "Ribeirão - Serrana",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg", "Ribeirão Preto", "Serrana"),
  },
  {
    endpoint: "scrap-ribeirao-serra-azul",
    id: "vsb-ribeirao-serra-azul",
    label: "Ribeirão - Serra Azul",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg", "Ribeirão Preto", "Serra Azul"),
  },
  {
    endpoint: "scrap-ribeirao-batatais",
    id: "vsb-ribeirao-batatais",
    label: "Ribeirão - Batatais",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Batatais.jpg", "Ribeirão Preto", "Batatais"),
  },
  {
    endpoint: "scrap-ribeirao-barrinha",
    id: "vsb-ribeirao-barrinha",
    label: "Ribeirão - Barrinha",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg", "Ribeirão Preto", "Barrinha"),
  },
  {
    endpoint: "scrap-ribeirao-altinopolis",
    id: "vsb-ribeirao-altinopolis",
    label: "Ribeirão - Altinópolis",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg", "Ribeirão Preto", "Altinópolis"),
  },
  {
    endpoint: "scrap-barrinha-sertaozinho",
    id: "vsb-barrinha-sertaozinho",
    label: "Barrinha - Sertãozinho",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg", "Barrinha", "Sertãozinho"),
  },
  {
    endpoint: "scrap-batatais-altinopolis",
    id: "vsb-batatais-altinopolis",
    label: "Batatais - Altinópolis",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg", "Batatais", "Altinópolis"),
  },
  {
    endpoint: "scrap-miguelopolis-ituverava",
    id: "vsb-miguelopolis-ituverava",
    label: "Miguelópolis - Ituverava",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg", "Miguelópolis", "Ituverava"),
  },
  {
    endpoint: "scrap-cachoeirinha-ituverava",
    id: "vsb-cachoeirinha-ituverava",
    label: "São Benedito - Ituverava",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg", "São Benedito da Cachoeirinha", "Ituverava"),
  },
  {
    endpoint: "scrap-miguelopolis-barretos",
    id: "vsb-miguelopolis-barretos",
    label: "Miguelópolis - Barretos",
    scraper: () => scrapeOcrFromImage("https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg", "Miguelópolis", "Barretos"),
  },
  {
    endpoint: "scrap-jaboticabal",
    id: "jaboticabal-cheerio",
    label: "Saída de Jaboticabal",
    scraper: () => scrapeCheerioJaboticabal("https://www.jaboticabal.sp.gov.br/horario-de-onibus", "Jaboticabal"),
  },
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
  }),
);

export function getScrapingJob(endpoint: string) {
  return scrapingJobsByEndpoint.get(endpoint);
}