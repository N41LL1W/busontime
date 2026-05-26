import React, { useEffect, useState } from "react";
import BusScheduleFilter from "../components/BusScheduleFilter";
import Footer from "../components/Footer";
import Header from "../components/Header";
import type { HorarioComFonte } from "./index";

const HomePage: React.FC = () => {
  const [horarios, setHorarios] = useState<HorarioComFonte[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadHorarios = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/horarios");
        if (!response.ok) {
          const body = await response.text();
          throw new Error(body || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const horariosComFonte = data.map((horario: HorarioComFonte) => ({
          ...horario,
          sourceUrl: horario.sourceUrl || "",
        }));
        if (isMounted) setHorarios(horariosComFonte);
      } catch (err) {
        console.error("Erro ao buscar horários:", err);
        if (isMounted) {
          setError(
            "Não foi possível consultar /api/horarios. Em exportação estática ou no app empacotado pelo Capacitor, as rotas /api/* não ficam disponíveis."
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadHorarios();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow p-4 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Horários de Ônibus</h1>
        {error && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {isLoading ? <p className="text-center">Carregando horários...</p> : <BusScheduleFilter schedules={horarios} />}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
