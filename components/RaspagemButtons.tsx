import { useState } from "react";
import { Button } from "@/components/ui/button";
import axios from "axios";

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
  { label: "São Benedito da Cachoerinha - Ituverava", endpoint: "scrap-cachoerinha-ituverava" },
  { label: "Miguelópolis - Baretos (via Guaíra)", endpoint: "scrap-miguelopolis-baretos" },
  { label: "Saida de Jaboticabal", endpoint: "scrap-jaboticabal" },
];

type Status = "idle" | "checking" | "updated" | "outdated";

export default function RaspagemButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, Status>>({});

  const scrap = async (endpoint: string) => {
    setLoading(endpoint);
    try {
      const res = await axios.post(`/api/${endpoint}`);
      alert(res.data.message);
    } catch (err) {
      alert("Erro ao fazer a raspagem.");
    } finally {
      setLoading(null);
    }
  };

  const resetDB = async () => {
    if (!confirm("Tem certeza que deseja apagar todos os registros e resetar o banco?")) return;

    setLoading("reset");
    try {
      const res = await axios.post("/api/reset-db");
      alert(res.data.message);
    } catch (err) {
      alert("Erro ao resetar o banco de dados.");
    } finally {
      setLoading(null);
    }
  };

  const scrapAll = async () => {
    for (const rota of rotas) {
      await scrap(rota.endpoint);
    }
  };

  const verificarRotas = async () => {
    for (const { endpoint } of rotas) {
      setStatusMap((prev) => ({ ...prev, [endpoint]: "checking" }));

      try {
        const res = await axios.post(`/api/verificacao/verificar-${endpoint}`);
        const statusRecebido: Status = res.data?.status === "updated" ? "updated" : "outdated";

        setStatusMap((prev) => ({
          ...prev,
          [endpoint]: statusRecebido,
        }));
      } catch (error) {
        setStatusMap((prev) => ({
          ...prev,
          [endpoint]: "outdated",
        }));
      }
    }
  };

  const getColor = (status: Status) => {
    switch (status) {
      case "checking":
        return "bg-yellow-500";
      case "updated":
        return "bg-green-500";
      case "outdated":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rotas.map(({ label, endpoint }) => {
          const status: Status = statusMap[endpoint] ?? "idle";

          return (
            <div key={endpoint} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => scrap(endpoint)}
                  disabled={loading !== null}
                  className="flex-1"
                >
                  {loading === endpoint ? "Raspando..." : label}
                </Button>
                <div
                  className={`w-4 h-4 rounded-full border ${getColor(status)}`}
                  title={status}
                />
              </div>
              {status && (
                <span className="text-xs text-gray-600 ml-2">
                  {status === "checking" && "Verificando..."}
                  {status === "updated" && "Atualizado"}
                  {status === "outdated" && "Desatualizado"}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 pt-4">
        <Button onClick={scrapAll} disabled={loading !== null} variant="outline">
          Raspagem Completa
        </Button>
        <Button onClick={verificarRotas} disabled={loading !== null} variant="secondary">
          Verificar com Semáforo
        </Button>
        <Button variant="destructive" onClick={resetDB} disabled={loading !== null}>
          {loading === "reset" ? "Limpando..." : "Zerar Banco de Dados"}
        </Button>
      </div>
    </div>
  );
}
