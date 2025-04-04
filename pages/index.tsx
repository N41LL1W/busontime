import React, { useEffect, useState } from "react";
import WeatherComponent from "../components/Weather";
import BusScheduleFilter from "../components/BusScheduleFilter";
import Calendar from "../components/Calendar";
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
    <div>
      <div className="mb-6">
        <Header />
      </div>
      <div className="p-4">
        <WeatherComponent />
        <Calendar />
        <BusScheduleFilter schedules={horarios} />
      </div>
      <div className="mt-10">
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
