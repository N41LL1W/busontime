import type { NextApiRequest, NextApiResponse } from "next";
import { syncSchedules } from "../../lib/database-sync";
import {
  getLegacySemiurbanoFallbackJob,
  getScrapingJob,
  scrapingJobs,
  type ScrapingJob,
} from "../../lib/scraping-jobs";
import type { ScrapedHorario } from "../../types/scrapers";

export const config = {
  api: {
    responseLimit: false,
  },
  maxDuration: 60,
};

type ScraperSummary = Pick<
  ScrapingJob,
  "id" | "endpoint" | "label" | "sourceUrl"
>;

type ScraperResponse = {
  message?: string;
  error?: string;
  warning?: string;
  count?: number;
  endpoint?: string;
  sourceUrl?: string;
  details?: string;
  availableScrapers?: ScraperSummary[];
};

type ScraperRunResult = {
  data: ScrapedHorario[];
  sourceUrl: string;
  usedFallback: boolean;
  error?: string;
};

function getEndpointParam(req: NextApiRequest): string | undefined {
  const { scraper } = req.query;

  if (Array.isArray(scraper)) {
    return scraper[0];
  }

  return scraper;
}

function formatErrorMessage(error: unknown, fallbackMessage: string): string {
  return error instanceof Error ? error.message : fallbackMessage;
}

function getAvailableScrapers(): ScraperSummary[] {
  return scrapingJobs.map(({ id, endpoint, label, sourceUrl }) => ({
    id,
    endpoint,
    label,
    sourceUrl,
  }));
}

async function runScraper(job: ScrapingJob): Promise<ScraperRunResult> {
  let data: ScrapedHorario[] = [];
  let sourceUrl = job.sourceUrl;
  let usedFallback = false;
  let errorMessage: string | undefined;

  try {
    data = await job.scraper();
  } catch (error) {
    errorMessage = formatErrorMessage(
      error,
      "Erro desconhecido na raspagem."
    );
    console.error(`[API Scrap] Erro na coleta de ${job.id}:`, error);
  }

  if (data.length > 0) {
    return { data, sourceUrl, usedFallback, error: errorMessage };
  }

  const fallbackJob = getLegacySemiurbanoFallbackJob(job);

  if (!fallbackJob) {
    return { data, sourceUrl, usedFallback, error: errorMessage };
  }

  console.warn(
    `[API Scrap] ${job.id} não retornou horários. Tentando fallback legado ${fallbackJob.id} (${fallbackJob.sourceUrl}).`
  );

  try {
    data = await fallbackJob.scraper();
    sourceUrl = fallbackJob.sourceUrl;
    usedFallback = data.length > 0;
  } catch (error) {
    const fallbackError = formatErrorMessage(
      error,
      "Erro desconhecido na fonte alternativa."
    );
    errorMessage = errorMessage
      ? `${errorMessage} | Fallback legado: ${fallbackError}`
      : `Fallback legado: ${fallbackError}`;
    console.error(`[API Scrap] Erro no fallback ${fallbackJob.id}:`, error);
  }

  return { data, sourceUrl, usedFallback, error: errorMessage };
}

function sendMethodNotAllowed(res: NextApiResponse<ScraperResponse>) {
  res.setHeader("Allow", ["GET", "POST"]);

  return res.status(405).json({
    error: "Método não permitido. Use GET para conferir o endpoint ou POST para executar a raspagem.",
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScraperResponse>
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return sendMethodNotAllowed(res);
  }

  const endpoint = getEndpointParam(req);

  if (!endpoint) {
    return res.status(400).json({
      error: "Endpoint de raspagem não informado.",
      availableScrapers: getAvailableScrapers(),
    });
  }

  const job = getScrapingJob(endpoint);

  if (!job) {
    return res.status(404).json({
      error: `Raspagem '${endpoint}' não cadastrada.`,
      endpoint,
      availableScrapers: getAvailableScrapers(),
    });
  }

  if (req.method === "GET") {
    return res.status(200).json({
      message: `Endpoint '${job.endpoint}' encontrado. Envie POST para executar a raspagem de ${job.label}.`,
      endpoint: job.endpoint,
      sourceUrl: job.sourceUrl,
    });
  }

  console.log(
    `[API Scrap] Executando ${job.id} (${job.label}) a partir de ${job.sourceUrl}`
  );

  const result = await runScraper(job);

  if (result.data.length === 0) {
    return res.status(200).json({
      warning: result.error
        ? `A raspagem de ${job.label} falhou ou voltou vazia: ${result.error}`
        : `A fonte atual e a fonte alternativa não retornaram dados para ${job.label}.`,
      count: 0,
      endpoint: job.endpoint,
      sourceUrl: result.sourceUrl,
    });
  }

  try {
    await syncSchedules(job.id, result.data);
  } catch (error) {
    console.error(`[API Scrap] Erro ao sincronizar ${job.id}:`, error);

    return res.status(500).json({
      error: `Horários coletados para ${job.label}, mas houve erro ao salvar no banco de dados.`,
      details: formatErrorMessage(
        error,
        "Erro desconhecido ao salvar no banco."
      ),
      endpoint: job.endpoint,
      sourceUrl: result.sourceUrl,
    });
  }

  return res.status(200).json({
    message: `Raspagem de ${job.label} concluída com ${result.data.length} horários sincronizados${
      result.usedFallback ? " usando a fonte alternativa" : ""
    }.`,
    count: result.data.length,
    endpoint: job.endpoint,
    sourceUrl: result.sourceUrl,
  });
}