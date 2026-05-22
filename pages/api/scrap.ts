import type { NextApiRequest, NextApiResponse } from 'next';
import { runScrapingJobs, scrapingJobs } from '../../lib/scraping-jobs';

export const config = {
  api: {
    responseLimit: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ jobs: scrapingJobs.map(({ id, label }) => ({ id, label })) });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const requestedJobIds = Array.isArray(req.body?.jobIds)
      ? req.body.jobIds.filter((id: unknown): id is string => typeof id === 'string')
      : undefined;

    const results = await runScrapingJobs(requestedJobIds);
    const successCount = results.filter((result) => result.status === 'success').length;
    const emptyCount = results.filter((result) => result.status === 'empty').length;
    const failedCount = results.filter((result) => result.status === 'failed').length;

    // ← ERA ISSO QUE FALTAVA: return e chave de abertura do objeto
    return res.status(200).json({
      message: `Raspagem finalizada: ${successCount} com dados, ${emptyCount} sem dados e ${failedCount} com falha.`,
      results,
    });
  } catch (error) {
    console.error('Erro ao executar raspagem:', error);
    return res.status(500).json({ message: 'Erro ao executar raspagem dos horários.' });
  }
}
