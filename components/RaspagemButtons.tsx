import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { RefreshCw, Zap, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const rotas = [
  { label: "Ribeirão - Jardinópolis", endpoint: "scrap-ribeirao-jardinopolis" },
  { label: "Jardinópolis - Ribeirão", endpoint: "scrap-jardinopolis-ribeirao" },
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
  { label: "São Benedito - Ituverava", endpoint: "scrap-cachoerinha-ituverava" },
  { label: "Miguelópolis - Barretos", endpoint: "scrap-miguelopolis-baretos" },
  { label: "Saída de Jaboticabal", endpoint: "scrap-jaboticabal" },
];

export default function RaspagemButtons() {
  const [loading, setLoading] = useState<string | null>(null);

  const scrap = async (endpoint: string) => {
    setLoading(endpoint);
    try {
      const res = await axios.post(`/api/${endpoint}`);
      alert(res.data.message);
    } catch {
      alert("Erro ao fazer a raspagem.");
    } finally {
      setLoading(null);
    }
  };

  const scrapAll = async () => {
    for (const rota of rotas) {
      await scrap(rota.endpoint);
    }
  };

  const resetDB = async () => {
    if (!confirm("Tem certeza que deseja apagar todos os registros e resetar o banco?")) return;
    setLoading("reset");
    try {
      const res = await axios.post("/api/reset-db");
      alert(res.data.message);
    } catch {
      alert("Erro ao resetar o banco de dados.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-center">Painel de Raspagem de Horários</h1>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {rotas.map(({ label, endpoint }) => (
          <div
            key={endpoint}
            className="p-4 border rounded-2xl shadow-md flex flex-col gap-2 transition-all hover:shadow-lg bg-white"
          >
            <span className="font-medium">{label}</span>
            <Button
              onClick={() => scrap(endpoint)}
              disabled={loading !== null}
              className="gap-2"
            >
              {loading === endpoint ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" /> Raspando...
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

      <div className="flex flex-wrap justify-center gap-4 pt-6">
        <Button onClick={scrapAll} disabled={loading !== null} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Raspagem Completa
        </Button>
        <Button onClick={resetDB} disabled={loading !== null} variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          {loading === "reset" ? "Limpando..." : "Zerar Banco"}
        </Button>
      </div>
    </div>
  );
}
