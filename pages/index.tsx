// pages/index.tsx
import React from "react";
import BusScheduleFilter from "../components/BusScheduleFilter";
import { GetStaticProps } from "next";
import prisma from "../lib/prisma";
import type { Horario as PrismaHorario } from "@prisma/client";

export type HorarioComFonte = PrismaHorario & { sourceUrl: string };

interface HomePageProps {
  horarios: HorarioComFonte[];
  error?: string;
}

const fontesDasRotas: Record<string, string> = {
  "ribeirão preto-jardinópolis": "https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/",
  "jardinópolis-ribeirão preto": "https://www.ribetransporte.com.br/linha-01/",
  // ... adicione todas as outras fontes aqui ...
};

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const horariosDoBanco = await prisma.horario.findMany({ orderBy: { horario: 'asc' } });
    const horariosComFonteInjetada = horariosDoBanco.map(horario => {
      const chaveDaRota = `${horario.origem.toLowerCase()}-${horario.destino.toLowerCase()}`;
      const sourceUrl = fontesDasRotas[chaveDaRota] || "";
      return { ...horario, sourceUrl };
    });
    return { props: { horarios: horariosComFonteInjetada }, revalidate: 3600 };
  } catch (error) {
    return { props: { horarios: [], error: "Erro ao carregar dados." }, revalidate: 60 };
  }
};

// Este é o conteúdo da ABA "Horários"
export default function HomePage({ horarios, error }: HomePageProps) {
  if (error) {
    return <p className="p-4 text-center text-red-500">{error}</p>;
  }

  // A página apenas renderiza o componente de filtro.
  return (
    <div className="p-4 md:p-6 pb-20">
      <BusScheduleFilter schedules={horarios} />
    </div>
  );
}