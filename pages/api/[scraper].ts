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

  try {
    console.log(
      `[API Scrap] Executando ${job.id} (${job.label}) a partir de ${job.sourceUrl}`
    );
    let scrapedData = await job.scraper();
    let sourceUrl = job.sourceUrl;
    let usedFallback = false;

    if (!scrapedData.length) {
      const fallbackJob = getLegacySemiurbanoFallbackJob(job);

      if (fallbackJob) {
        console.warn(
          `[API Scrap] ${job.id} não retornou horários. Tentando fallback ${fallbackJob.id} (${fallbackJob.sourceUrl}).`
        );
        scrapedData = await fallbackJob.scraper();
        sourceUrl = fallbackJob.sourceUrl;
        usedFallback = scrapedData.length > 0;
      }
    }

    if (!scrapedData.length) {
      return res.status(200).json({
        message: `Nenhum horário novo foi encontrado para ${job.label}. A fonte pode estar temporariamente indisponível ou sem dados textuais para esta linha.`,
        warning: `Nenhum horário foi encontrado para ${job.label}.`,
        count: 0,
        endpoint: job.endpoint,
        sourceUrl,
      });
    }

    await syncSchedules(job.id, scrapedData);

    return res.status(200).json({
      message: `Raspagem de ${job.label} concluída com ${scrapedData.length} horários sincronizados${usedFallback ? " usando a fonte alternativa." : ""}.`,
      count: scrapedData.length,
      endpoint: job.endpoint,
      sourceUrl,
    });
  } catch (error) {
    console.error(`[API Scrap] Erro ao executar ${job.id}:`, error);
    return res.status(500).json({
      error: `Erro ao fazer a raspagem de ${job.label}.`,
      endpoint: job.endpoint,
      sourceUrl: job.sourceUrl,
    });
  }
}