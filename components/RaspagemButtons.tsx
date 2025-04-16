"use client";

import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

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

export default function RaspagemButtons() {
  const [loading, setLoading] = useState<string | null>(null);

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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {rotas.map(({ label, endpoint }) => (
        <Button
          key={endpoint}
          onClick={() => scrap(endpoint)}
          disabled={loading !== null}
        >
          {loading === endpoint ? "Raspando..." : label}
        </Button>
      ))}

      {/* Botão de resetar banco */}
      <Button
        variant="destructive"
        onClick={resetDB}
        disabled={loading !== null}
      >
        {loading === "reset" ? "Limpando..." : "Zerar Banco de Dados"}
      </Button>
    </div>
  );
}
