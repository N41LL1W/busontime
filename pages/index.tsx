import React, { useEffect, useState } from "react";
import Head from "next/head";

import BusScheduleFilter from "../components/BusScheduleFilter";
import type { HorarioComFonte } from "@/types/horario";

export default function HomePage() {
  const [horarios, setHorarios] = useState<HorarioComFonte[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const carregarHorarios = async () => {
      try {
        let response = await fetch("/horarios.json");

        if (!response.ok) {
          response = await fetch("/api/horarios");
        }

        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados do servidor.");
        }

        const data = (await response.json()) as HorarioComFonte[];

        if (isMounted) {
          setHorarios(data);
          setError("");
        }
      } catch (error) {
        console.error("Erro ao buscar horários:", error);

        if (isMounted) {
          setHorarios([]);
          setError("Não foi possível carregar os dados do servidor. Tente novamente mais tarde.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    carregarHorarios();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Head>
        <title>BusOnTime - Horários de Ônibus</title>
        <meta name="description" content="Encontre os horários de ônibus da sua região de forma fácil e rápida." />
      </Head>
      <div className="flex flex-col items-center w-full p-4 md:p-6 pb-24">
        <div className="w-full max-w-5xl">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-xl font-semibold text-foreground">Encontre seu próximo ônibus</h2>
            <p className="text-sm text-muted-foreground">Selecione a data, hora, origem e destino para ver os horários disponíveis.</p>
          </div>

          {error ? (
            <div className="p-4 text-center border-2 border-dashed rounded-lg">
              <h2 className="text-lg font-semibold text-destructive">Oops! Algo deu errado.</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="p-4 text-center border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">Carregando horários...</p>
            </div>
          ) : (
            <BusScheduleFilter schedules={horarios} />
          )}
        </div>
      </div>
    </>
  );
}
