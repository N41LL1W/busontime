import type { NextApiRequest, NextApiResponse } from "next";
import { syncSchedules } from "../../lib/database-sync";
import { getLegacySemiurbanoFallbackJob, getScrapingJob } from "../../lib/scraping-jobs";

export const config = {
  api: {
    responseLimit: false,
  },
  maxDuration: 60,
};

type ScrapResponse = {
  message?: string;
  error?: string;
  warning?: string;
  count?: number;
  endpoint?: string;
  sourceUrl?: string;
  details?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScrapResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const endpoint = Array.isArray(req.query.scraper)
    ? req.query.scraper[0]
    : req.query.scraper;

  if (!endpoint) {
    return res
      .status(400)
      .json({ error: "Endpoint de raspagem não informado" });
  }

  const job = getScrapingJob(endpoint);

  if (!job) {
    return res.status(404).json({
      error: `Raspagem '${endpoint}' não cadastrada`,
      endpoint,
    });
  }
  console.log(
    `[API Scrap] Executando ${job.id} (${job.label}) a partir de ${job.sourceUrl}`
  );

  let scrapedData = [] as Awaited<ReturnType<typeof job.scraper>>;
  let sourceUrl = job.sourceUrl;
  let usedFallback = false;
  let scrapingError: string | undefined;

  try {
    scrapedData = await job.scraper();
  } catch (error) {
    scrapingError = error instanceof Error ? error.message : "Erro desconhecido na raspagem.";
    console.error(`[API Scrap] Erro na coleta de ${job.id}:`, error);
  }

  if (!scrapedData.length && req.query.fallback === "legacy") {
    const fallbackJob = getLegacySemiurbanoFallbackJob(job);

    if (fallbackJob) {
      console.warn(
        `[API Scrap] ${job.id} não retornou horários. Tentando fallback legado ${fallbackJob.id} (${fallbackJob.sourceUrl}).`
      );

      try {
        scrapedData = await fallbackJob.scraper();
        sourceUrl = fallbackJob.sourceUrl;
        usedFallback = scrapedData.length > 0;
      } catch (error) {
        const fallbackError = error instanceof Error ? error.message : "Erro desconhecido na fonte alternativa.";
        scrapingError = scrapingError
          ? `${scrapingError} | Fallback legado: ${fallbackError}`
          : `Fallback legado: ${fallbackError}`;
        console.error(`[API Scrap] Erro no fallback ${fallbackJob.id}:`, error);
      }
    }

  if (!scrapedData.length) {
    return res.status(200).json({
      message: `Nenhum horário novo foi encontrado para ${job.label}. A fonte textual pode estar temporariamente indisponível ou sem dados para esta linha. Para tentar a fonte antiga com OCR, chame /api/${job.endpoint}?fallback=legacy.`,
      warning: scrapingError
        ? `A raspagem de ${job.label} falhou na fonte atual: ${scrapingError}`
        : `Nenhum horário foi encontrado para ${job.label}.`,
      count: 0,
      endpoint: job.endpoint,
      sourceUrl,
    });
  }

  try {
    await syncSchedules(job.id, scrapedData);
  } catch (error) {
    console.error(`[API Scrap] Erro ao sincronizar ${job.id}:`, error);
    return res.status(500).json({
      error: `Horários coletados para ${job.label}, mas houve erro ao salvar no banco de dados.`,
      details: error instanceof Error ? error.message : "Erro desconhecido ao salvar no banco.",
      endpoint: job.endpoint,
      sourceUrl,
    });
  }
}

  return res.status(200).json({
    message: `Raspagem de ${job.label} concluída com ${scrapedData.length} horários sincronizados${usedFallback ? " usando a fonte alternativa." : ""}.`,
    count: scrapedData.length,
    endpoint: job.endpoint,
    sourceUrl,
  });
}