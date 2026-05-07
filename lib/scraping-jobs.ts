import { scrapeCheerioJaboticabal } from "../scrapers/cheerio-jaboticabal";
import { scrapeRibeTransporte } from "../scrapers/cheerio-ribetransporte";
import { scrapeSemiurbanoSaoBento } from "../scrapers/semiurbano-sao-bento";
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

function cheerioJob(
  endpoint: string,
  id: string,
  label: string,
  sourceUrl: string,
  scraper: () => Promise<ScrapedHorario[]>
): ScrapingJob {
  return { endpoint, id, label, sourceUrl, scraper };
}

const SEMIURBANO_SAO_BENTO_URL = "https://semiurbano.lovable.app/horarios";

const saoBentoSemiurbanoJob = cheerioJob(
  "scrap-semiurbano-sao-bento",
  "vsb-semiurbano-site-oficial",
  "Viação São Bento — todas as linhas semiurbanas",
  SEMIURBANO_SAO_BENTO_URL,
  () => scrapeSemiurbanoSaoBento(SEMIURBANO_SAO_BENTO_URL)
);

const jobs: ScrapingJob[] = [
  saoBentoSemiurbanoJob,
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
  "scrap-cachoerinha-ituverava": "scrap-semiurbano-sao-bento",
  "scrap-miguelopolis-baretos": "scrap-semiurbano-sao-bento",
  "scrap-ribeirao-brodowski": "scrap-semiurbano-sao-bento",
  "scrap-brodowski-batatais": "scrap-semiurbano-sao-bento",
  "scrap-ribeirao-sertaozinho": "scrap-semiurbano-sao-bento",
  "scrap-ribeirao-serrana": "scrap-semiurbano-sao-bento",
  "scrap-ribeirao-serra-azul": "scrap-semiurbano-sao-bento",
  "scrap-ribeirao-batatais": "scrap-semiurbano-sao-bento",
  "scrap-ribeirao-barrinha": "scrap-semiurbano-sao-bento",
  "scrap-ribeirao-altinopolis": "scrap-semiurbano-sao-bento",
  "scrap-barrinha-sertaozinho": "scrap-semiurbano-sao-bento",
  "scrap-batatais-altinopolis": "scrap-semiurbano-sao-bento",
  "scrap-miguelopolis-ituverava": "scrap-semiurbano-sao-bento",
  "scrap-cachoeirinha-ituverava": "scrap-semiurbano-sao-bento",
  "scrap-miguelopolis-barretos": "scrap-semiurbano-sao-bento",
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
