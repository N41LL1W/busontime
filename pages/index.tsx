// pages/index.tsx
import React, { useEffect, useState } from "react";
import BusScheduleFilter from "../components/BusScheduleFilter";
import type { Horario } from "../types/schedule"; // Importe o tipo
import { GetStaticProps } from "next";
import prisma from "../lib/prisma"; // Use o Prisma diretamente aqui

// Tipagem para as props da página
interface HomePageProps {
  horarios: Horario[];
  error?: string;
}

// 1. getStaticProps é executado no servidor durante o build (e revalidação)
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    console.log("getStaticProps: Buscando horários para pré-renderização...");
    const horariosData = await prisma.horario.findMany({
      orderBy: { horario: 'asc' },
    });

    // O Prisma retorna objetos Date que não são serializáveis para JSON.
    // Se você tiver campos de Data/Hora no seu schema, precisa convertê-los para string.
    // O seu tipo 'Horario' atual usa string, então está ok.

    return {
      props: {
        horarios: horariosData,
      },
      // 2. Revalidate: Next.js irá tentar gerar a página novamente no máximo a cada 1 hora.
      // Isso mantém os dados atualizados sem precisar de um rebuild do site.
      revalidate: 3600, // 1 hora em segundos
    };
  } catch (error) {
    console.error("Erro em getStaticProps:", error);
    return {
      props: {
        horarios: [],
        error: "Não foi possível carregar os horários no momento.",
      },
      revalidate: 60, // Tente novamente em 1 minuto se der erro
    };
  }
};

// 3. O componente da página agora recebe os horários via props
export default function HomePage({ horarios, error }: HomePageProps) {
  // O estado de dark mode e a lógica de UI permanecem os mesmos
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDarkModePreferred = window.localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkModePreferred);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
      window.localStorage.setItem('darkMode', 'true');
    } else {
      html.classList.remove("dark");
      window.localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <header className="flex justify-between items-center p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold">Horários de Ônibus</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          {darkMode ? "Modo Claro" : "Modo Escuro"}
        </button>
      </header>

      <main className="p-4">
        {/* Não precisamos mais de estado de loading/erro para a carga inicial! */}
        {error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <BusScheduleFilter schedules={horarios} />
        )}
      </main>

      <footer className="text-center p-4 text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Horários de Ônibus
      </footer>
    </div>
  );
}