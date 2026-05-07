import { useMemo, useState } from "react";
import axios from "axios";
import { AlertCircle, CheckCircle, Database, Loader2, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const semiurbanoRoutes = [
  { label: "Ribeirão - Brodowski", endpoint: "scrap-ribeirao-brodowski" },
  { label: "Brodowski - Batatais", endpoint: "scrap-brodowski-batatais" },
  { label: "Ribeirão - Sertãozinho", endpoint: "scrap-ribeirao-sertaozinho" },
  { label: "Ribeirão - Serrana", endpoint: "scrap-ribeirao-serrana" },
  { label: "Ribeirão - Serra Azul", endpoint: "scrap-ribeirao-serra-azul" },
  { label: "Ribeirão - Batatais", endpoint: "scrap-ribeirao-batatais" },
  { label: "Ribeirão - Barrinha", endpoint: "scrap-ribeirao-barrinha" },
  { label: "Ribeirão - Altinópolis", endpoint: "scrap-ribeirao-altinopolis" },
  { label: "Barrinha - Sertãozinho", endpoint: "scrap-barrinha-sertaozinho" },
  { label: "Batatais - Altinópolis", endpoint: "scrap-batatais-altinopolis" },
  { label: "Miguelópolis - Ituverava", endpoint: "scrap-miguelopolis-ituverava" },
  { label: "São Benedito - Ituverava", endpoint: "scrap-cachoeirinha-ituverava" },
  { label: "Miguelópolis - Barretos", endpoint: "scrap-miguelopolis-barretos" },
];

type Status = {
  label: string;
  endpoint: string;
  state: "success" | "error";
  message: string;
  count?: number;
  sourceUrl?: string;
};

export default function SemiurbanoConfigPanel() {
  const [loading, setLoading] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);

  const totalSincronizado = useMemo(
    () => statuses.reduce((total, status) => total + (status.count || 0), 0),
    [statuses]
  );

  const runScraper = async (route: (typeof semiurbanoRoutes)[number]) => {
    setLoading(route.endpoint);

    try {
      const res = await axios.post(`/api/${route.endpoint}`);
      const status: Status = {
        label: route.label,
        endpoint: route.endpoint,
        state: "success",
        message: res.data.message || "Raspagem concluída.",
        count: res.data.count,
        sourceUrl: res.data.sourceUrl,
      };
      setStatuses((current) => [status, ...current.filter((item) => item.endpoint !== route.endpoint)]);
      return status;
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data : undefined;
      const status: Status = {
        label: route.label,
        endpoint: route.endpoint,
        state: "error",
        message: data?.error || data?.message || "Erro ao fazer a raspagem.",
        sourceUrl: data?.sourceUrl,
      };
      setStatuses((current) => [status, ...current.filter((item) => item.endpoint !== route.endpoint)]);
      return status;
    } finally {
      setLoading(null);
    }
  };

  const runAll = async () => {
    setStatuses([]);
    for (const route of semiurbanoRoutes) {
      await runScraper(route);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-green-700">Configuração</p>
            <h1 className="text-3xl font-bold text-gray-900">Raspagem do Semiurbano São Bento</h1>
            <p className="mt-2 max-w-3xl text-gray-600">
              Esta página usa a nova resposta textual do site Semiurbano, sem OCR em imagem, e sincroniza os horários encontrados diretamente no banco de dados.
            </p>
          </div>

          <Button onClick={runAll} disabled={loading !== null} className="gap-2 bg-green-700 hover:bg-green-600">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Raspar tudo e carregar no DB
          </Button>
        </div>

        <div className="mt-6 rounded-2xl bg-green-50 p-4 text-sm text-green-900">
          <div className="flex items-center gap-2 font-semibold">
            <RefreshCw className="h-4 w-4" /> Fonte atual
          </div>
          <a className="mt-1 block break-all underline" href="https://semiurbano.lovable.app/" target="_blank" rel="noreferrer">
            https://semiurbano.lovable.app/
          </a>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {semiurbanoRoutes.map((route) => (
          <article key={route.endpoint} className="rounded-2xl border bg-white p-4 shadow-sm transition hover:shadow-md">
            <h2 className="font-semibold text-gray-900">{route.label}</h2>
            <p className="mt-1 text-xs text-gray-500">Endpoint: /api/{route.endpoint}</p>
            <Button
              onClick={() => runScraper(route)}
              disabled={loading !== null}
              variant="outline"
              className="mt-4 w-full gap-2"
            >
              {loading === route.endpoint ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Raspando e salvando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Raspar esta linha
                </>
              )}
            </Button>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Resultado das sincronizações</h2>
            <p className="text-sm text-gray-600">Total sincronizado nesta tela: {totalSincronizado} horário(s).</p>
          </div>
          {loading && <Loader2 className="h-5 w-5 animate-spin text-green-700" />}
        </div>

        {statuses.length === 0 ? (
          <p className="mt-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
            Nenhuma raspagem executada ainda nesta sessão.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {statuses.map((status) => (
              <div
                key={status.endpoint}
                className={`rounded-2xl border p-4 ${
                  status.state === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  {status.state === "success" ? (
                    <CheckCircle className="mt-0.5 h-5 w-5 text-green-700" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-5 w-5 text-red-700" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{status.label}</p>
                    <p className="text-sm text-gray-700">{status.message}</p>
                    {status.sourceUrl && (
                      <a className="mt-1 block break-all text-xs underline" href={status.sourceUrl} target="_blank" rel="noreferrer">
                        Fonte: {status.sourceUrl}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
