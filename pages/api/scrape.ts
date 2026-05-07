import type { NextApiRequest, NextApiResponse } from 'next';
import { getScrapingJob, runAllScrapingJobs, runScrapingJob, scrapingJobs } from '../../lib/scraping-jobs';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ jobs: scrapingJobs.map(({ id, label, provider }) => ({ id, label, provider })) });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { jobId = 'all' } = req.body || {};

  try {
    if (jobId === 'all') {
      const results = await runAllScrapingJobs();
      return res.status(200).json({ message: 'Raspagem completa finalizada.', results });
    }

    const job = getScrapingJob(String(jobId));

    if (!job) {
      return res.status(404).json({ message: 'Job de raspagem não encontrado.' });
    }

    const result = await runScrapingJob(job);
    return res.status(200).json({ message: `Raspagem de ${job.label} finalizada.`, result });
  } catch (error) {
    console.error('[API Scrape] Erro ao executar raspagem:', error);
    return res.status(500).json({ message: 'Erro ao executar raspagem.' });
  }
}
