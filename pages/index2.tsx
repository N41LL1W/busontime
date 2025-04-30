import React, { useEffect, useState } from "react";
import BusScheduleFilter from "../components/BusScheduleFilter";
import Footer from "../components/Footer";
import Header from "../components/Header";

const HomePage: React.FC = () => {
  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    fetch("/api/horarios")
      .then((res) => res.json())
      .then((data) => setHorarios(data))
      .catch((err) => console.error("Erro ao buscar horários:", err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="flex-grow p-4 max-w-5xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Horários de Ônibus</h1>
        <BusScheduleFilter schedules={horarios} />
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
