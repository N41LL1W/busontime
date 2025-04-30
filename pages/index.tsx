// pages/index.tsx
import React, { useEffect, useState } from "react";
import BusScheduleFilter from "../components/BusScheduleFilter";

export default function HomePage() {
  const [horarios, setHorarios] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    fetch("/api/horarios")
      .then((res) => res.json())
      .then((data) => setHorarios(data))
      .catch((err) => console.error("Erro ao buscar horários:", err));
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
        <h1 className="text-2xl font-bold">Horários de Ônibus</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          {darkMode ? "Modo Claro" : "Modo Escuro"}
        </button>
      </div>

      <div className="p-4">
        <BusScheduleFilter schedules={horarios} />
      </div>

      <footer className="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} Horários de Ônibus
      </footer>
    </div>
  );
}
