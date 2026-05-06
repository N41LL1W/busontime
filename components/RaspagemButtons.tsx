import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Zap, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const rotas = [
  { label: 'Ribeirão - Jardinópolis', endpoint: 'scrap-ribeirao-jardinopolis' },
  { label: 'Jardinópolis - Ribeirão', endpoint: 'scrap-jardinopolis-ribeirao' },
  { label: 'Ribeirão - Brodowski', endpoint: 'scrap-ribeirao-brodowski' },
  { label: 'Brodowski - Batatais', endpoint: 'scrap-brodowski-batatais' },
  { label: 'Ribeirão - Sertãozinho', endpoint: 'scrap-ribeirao-sertaozinho' },
  { label: 'Ribeirão - Serrana', endpoint: 'scrap-ribeirao-serrana' },
  { label: 'Ribeirão - Serra Azul', endpoint: 'scrap-ribeirao-serra-azul' },
  { label: 'Ribeirão - Batatais', endpoint: 'scrap-ribeirao-batatais' },
  { label: 'Ribeirão - Barrinha', endpoint: 'scrap-ribeirao-barrinha' },
  { label: 'Ribeirão - Altinópolis', endpoint: 'scrap-ribeirao-altinopolis' },
  { label: 'Barrinha - Sertãozinho', endpoint: 'scrap-barrinha-sertaozinho' },
  { label: 'Batatais - Altinópolis', endpoint: 'scrap-batatais-altinopolis' },
  { label: 'Miguelópolis - Ituverava', endpoint: 'scrap-miguelopolis-ituverava' },
  { label: 'São Benedito - Ituverava', endpoint: 'scrap-cachoerinha-ituverava' },
  { label: 'Miguelópolis - Barretos', endpoint: 'scrap-miguelopolis-barretos' },
  { label: 'Saída de Jaboticabal', endpoint: 'scrap-jaboticabal' },
];

type RaspagemButtonsProps = {
  onUpdated?: () => void;
};

type Feedback = {
  type: 'success' | 'error' | 'info';
  message: string;
};

export default function RaspagemButtons({ onUpdated }: RaspagemButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const runScrape = async (payload: { jobId?: string; runAll?: boolean }, loadingKey: string) => {
    setLoading(loadingKey);
    setFeedback({ type: 'info', message: 'Atualizando horários. Isso pode levar alguns instantes...' });

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok && response.status !== 207) {
        throw new Error(data.message || 'Erro ao fazer a raspagem.');
      }

      const total = Array.isArray(data.results)
        ? data.results.reduce((sum: number, result: { scraped?: number }) => sum + (result.scraped || 0), 0)
        : 0;

      setFeedback({
        type: response.status === 207 ? 'error' : 'success',
        message: `${data.message} ${total} horários encontrados nas fontes executadas.`,
      });
      onUpdated?.();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao fazer a raspagem.',
      });
    } finally {
      setLoading(null);
    }
  };

  const resetDB = async () => {
    if (!confirm('Tem certeza que deseja apagar todos os registros e resetar o banco?')) return;
    setLoading('reset');
    setFeedback({ type: 'info', message: 'Solicitando limpeza do banco de dados...' });

    try {
      const response = await fetch('/api/reset-db', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao resetar o banco de dados.');
      }

      setFeedback({ type: 'success', message: data.message });
      onUpdated?.();
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erro ao resetar o banco de dados.',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Painel de raspagem de horários</h2>
          <p className="text-sm text-muted-foreground">Execute uma rota específica ou atualize todas as fontes configuradas.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => runScrape({ runAll: true }, 'all')} disabled={loading !== null} variant="outline" className="gap-2">
            {loading === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Raspagem completa
          </Button>
          <Button onClick={resetDB} disabled={loading !== null} variant="destructive" className="gap-2">
            {loading === 'reset' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Zerar banco
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
              : feedback.type === 'error'
                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                : 'border-border bg-muted text-muted-foreground'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rotas.map(({ label, endpoint }) => (
          <div key={endpoint} className="rounded-2xl border bg-background p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <span className="font-medium">{label}</span>
            <Button onClick={() => runScrape({ jobId: endpoint }, endpoint)} disabled={loading !== null} className="mt-3 w-full gap-2">
              {loading === endpoint ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Raspando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Raspagem
                </>
              )}
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
