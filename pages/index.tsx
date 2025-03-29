import React, { useEffect, useState } from "react";
import HorarioTable from "../components/HorarioTable";
import WeatherComponent from "../components/Weather";
import Footer from '../components/Footer';
import Header from '../components/Header';


const Page: React.FC = () => {
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    fetch("/api/horarios")
      .then((res) => res.json())
      .then((data) => setHorarios(data))
      .catch((err) => console.error("Erro ao buscar horários:", err));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <Header />
      </div>
      <div className="p-4">
          <WeatherComponent />
        <h1 className="text-2xl font-bold mb-4">Tabela de Horários</h1>
        <HorarioTable horarios={horarios} />
      </div>
      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
};

export default Page;
