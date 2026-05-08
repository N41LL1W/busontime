import { useState } from 'react';
import axios from 'axios';
import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

type ScrapingResult = {
  id: string;
  label: string;
  status: 'success' | 'empty' | 'failed';
  count: number;
  error?: string;
};

export default function RaspagemButtons() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<ScrapingResult[]>([]);

  const scrapAll = async () => {
    if (!confirm('Puxar novamente os horários dos sites oficiais? Isso pode demorar alguns minutos.')) return;

    setLoading(true);
    setMessage('Puxando horários dos sites oficiais...');
    setResults([]);

    try {
      const res = await axios.post('/api/scrap');
      setMessage(res.data.message || 'Raspagem finalizada.');
      setResults(res.data.results || []);
    } catch (error) {
      const apiMessage = axios.isAxiosError(error) ? error.response?.data?.message : undefined;
      setMessage(apiMessage || 'Erro ao fazer a raspagem. Se o site oficial mudou, corrija manualmente na tabela abaixo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Atualização automática</p>
          <h2 className="text-2xl font-bold">Puxar horários dos sites oficiais</h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Use este botão para tentar sincronizar tudo novamente. Como alguns horários do Semiurbano/VSB estão em imagem, a leitura automática pode falhar; depois confira e ajuste manualmente logo abaixo.
          </p>
        </div>
        <button
          type="button"
          onClick={scrapAll}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Puxando...' : 'Puxar horários'}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm dark:bg-zinc-800">
          {message}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {results.map((result) => (
            <div key={result.id} className="flex items-start gap-2 rounded border p-3 text-sm">
              {result.status === 'failed' ? <AlertCircle className="mt-0.5 h-4 w-4 text-red-600" /> : <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />}
              <div>
                <p className="font-semibold">{result.label}</p>
                <p className="text-muted-foreground">
                  {result.status === 'success' && `${result.count} horários sincronizados.`}
                  {result.status === 'empty' && 'Nenhum horário encontrado nessa origem.'}
                  {result.status === 'failed' && (result.error || 'Falha ao sincronizar.')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
