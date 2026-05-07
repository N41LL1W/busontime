import { scrapeCheerioJaboticabal } from "../scrapers/cheerio-jaboticabal";
import { scrapeRibeTransporte } from "../scrapers/cheerio-ribetransporte";
import {
  SEMIURBANO_APP_URL,
  scrapeSemiurbanoRoute,
} from "../scrapers/cheerio-semiurbano";
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


function semiurbanoJob(
  endpoint: string,
  id: string,
  label: string,
  origem: string,
  destino: string
): ScrapingJob {
  return cheerioJob(endpoint, id, label, SEMIURBANO_APP_URL, () =>
    scrapeSemiurbanoRoute({ origem, destino, label })
  );
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
  semiurbanoJob(
    "scrap-ribeirao-brodowski",
    "vsb-ribeirao-brodowski",
    "Ribeirão - Brodowski",
    "Ribeirão Preto",
    "Brodowski"
  ),
  semiurbanoJob(
    "scrap-brodowski-batatais",
    "vsb-brodowski-batatais",
    "Brodowski - Batatais",
    "Brodowski",
    "Batatais"
  ),
  semiurbanoJob(
    "scrap-ribeirao-sertaozinho",
    "vsb-ribeirao-sertaozinho",
    "Ribeirão - Sertãozinho",
    "Ribeirão Preto",
    "Sertãozinho"
  ),
  semiurbanoJob(
    "scrap-ribeirao-serrana",
    "vsb-ribeirao-serrana",
    "Ribeirão - Serrana",
    "Ribeirão Preto",
    "Serrana"
  ),
  semiurbanoJob(
    "scrap-ribeirao-serra-azul",
    "vsb-ribeirao-serra-azul",
    "Ribeirão - Serra Azul",
    "Ribeirão Preto",
    "Serra Azul"
  ),
  semiurbanoJob(
    "scrap-ribeirao-batatais",
    "vsb-ribeirao-batatais",
    "Ribeirão - Batatais",
    "Ribeirão Preto",
    "Batatais"
  ),
  semiurbanoJob(
    "scrap-ribeirao-barrinha",
    "vsb-ribeirao-barrinha",
    "Ribeirão - Barrinha",
    "Ribeirão Preto",
    "Barrinha"
  ),
  semiurbanoJob(
    "scrap-ribeirao-altinopolis",
    "vsb-ribeirao-altinopolis",
    "Ribeirão - Altinópolis",
    "Ribeirão Preto",
    "Altinópolis"
  ),
  semiurbanoJob(
    "scrap-barrinha-sertaozinho",
    "vsb-barrinha-sertaozinho",
    "Barrinha - Sertãozinho",
    "Barrinha",
    "Sertãozinho"
  ),
  semiurbanoJob(
    "scrap-batatais-altinopolis",
    "vsb-batatais-altinopolis",
    "Batatais - Altinópolis",
    "Batatais",
    "Altinópolis"
  ),
  semiurbanoJob(
    "scrap-miguelopolis-ituverava",
    "vsb-miguelopolis-ituverava",
    "Miguelópolis - Ituverava",
    "Miguelópolis",
    "Ituverava"
  ),
  semiurbanoJob(
    "scrap-cachoeirinha-ituverava",
    "vsb-cachoeirinha-ituverava",
    "São Benedito - Ituverava",
    "São Benedito da Cachoeirinha",
    "Ituverava"
  ),
  semiurbanoJob(
    "scrap-miguelopolis-barretos",
    "vsb-miguelopolis-barretos",
    "Miguelópolis - Barretos",
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