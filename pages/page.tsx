import React, { useEffect, useState } from "react";
import HorarioTable from "../components/HorarioTable";
import WeatherComponent from "../components/Weather";

const Page: React.FC = () => {
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    fetch("/api/horarios")
      .then((res) => res.json())
      .then((data) => setHorarios(data))
      .catch((err) => console.error("Erro ao buscar horários:", err));
  }, []);

  return (
    <div className="p-4">
        <WeatherComponent />
      <h1 className="text-2xl font-bold mb-4">Tabela de Horários</h1>
      <HorarioTable horarios={horarios} />
    </div>
  );
};

export default Page;
