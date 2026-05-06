import type { NextApiRequest, NextApiResponse } from 'next';
import { runScrapingJob, scrapingJobs } from '../../lib/scraping-jobs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { jobId, runAll } = req.body || {};
  const jobsToRun = runAll ? scrapingJobs : scrapingJobs.filter((job) => job.id === jobId);

  if (jobsToRun.length === 0) {
    return res.status(400).json({
      message: 'Rota de raspagem não encontrada.',
      availableJobs: scrapingJobs.map(({ id, label }) => ({ id, label })),
    });
  }

  try {
    const results = await Promise.allSettled(jobsToRun.map((job) => runScrapingJob(job)));
    const payload = results.map((result, index) => {
      const job = jobsToRun[index];

      if (result.status === 'fulfilled') {
        return result.value;
      }

      return {
        id: job.id,
        label: job.label,
        scraped: 0,
        synced: false,
        error: result.reason instanceof Error ? result.reason.message : 'Erro inesperado na raspagem.',
      };
    });
    const hasFailure = payload.some((result) => 'error' in result);

    return res.status(hasFailure ? 207 : 200).json({
      message: hasFailure ? 'Algumas raspagens falharam.' : 'Horários atualizados com sucesso.',
      results: payload,
    });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Erro ao atualizar horários.',
    });
  }
}
