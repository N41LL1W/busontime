import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Trash2, Loader2, DatabaseZap } from 'lucide-react';

type ScrapingJob = {
  id: string;
  label: string;
  provider: string;
};

type StatusMessage = {
  type: 'success' | 'error' | 'info';
  text: string;
};

export default function RaspagemButtons() {
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    fetch('/api/scrape')
      .then((response) => response.json())
      .then((data) => setJobs(data.jobs || []))
      .catch(() => setStatus({ type: 'error', text: 'Não foi possível carregar a lista de raspagens.' }));
  }, []);

  const runScrape = async (jobId: string) => {
    setLoading(jobId);
    setStatus({ type: 'info', text: 'Raspagem em andamento. Aguarde a sincronização com o banco.' });

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer a raspagem.');
      }

      setStatus({ type: 'success', text: data.message });
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao fazer a raspagem.' });
    } finally {
      setLoading(null);
    }
  };

  const resetDB = async () => {
    if (!confirm('Tem certeza que deseja apagar todos os horários cadastrados?')) return;

    setLoading('reset');
    setStatus({ type: 'info', text: 'Limpando a tabela de horários...' });

    try {
      const response = await fetch('/api/reset-db', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao resetar o banco de dados.');
      }

      setStatus({ type: 'success', text: data.message });
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Erro ao resetar o banco de dados.' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 text-center md:text-left">
        <span className="text-sm font-semibold uppercase tracking-[0.3em] text-green-700">Raspagem</span>
        <h2 className="text-2xl font-bold text-gray-950">Atualização das fontes de horários</h2>
        <p className="text-sm text-muted-foreground">
          Execute uma rota específica ou rode a carga completa para atualizar as tabelas do sistema.
        </p>
      </div>

      {status && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            status.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : status.type === 'error'
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        {jobs.map((job) => (
          <div key={job.id} className="rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <span className="text-xs font-semibold uppercase tracking-wide text-green-700">{job.provider}</span>
            <h3 className="mt-2 min-h-12 font-semibold text-gray-950">{job.label}</h3>
            <Button onClick={() => runScrape(job.id)} disabled={loading !== null} className="mt-4 w-full gap-2">
              {loading === job.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Raspando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Atualizar rota
                </>
              )}
            </Button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-4 rounded-3xl border bg-gray-50 p-4 md:justify-start">
        <Button onClick={() => runScrape('all')} disabled={loading !== null} variant="outline" className="gap-2">
          {loading === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Raspagem completa
        </Button>
        <Button onClick={() => window.dispatchEvent(new Event('busontime:refresh-horarios'))} disabled={loading !== null} variant="outline" className="gap-2">
          <DatabaseZap className="h-4 w-4" /> Atualizar tabela
        </Button>
        <Button onClick={resetDB} disabled={loading !== null} variant="destructive" className="gap-2">
          {loading === 'reset' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Zerar horários
        </Button>
      </div>
    </section>
  );
}
