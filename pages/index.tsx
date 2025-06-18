// pages/index.tsx
import React from "react";
import BusScheduleFilter from "../components/BusScheduleFilter";
import { GetStaticProps } from "next";
import prisma from "../lib/prisma";

// IMPORTANTE: Este tipo agora é nosso. Ele estende o tipo do Prisma com o novo campo.
import type { Horario as PrismaHorario } from "@prisma/client";
export type HorarioComFonte = PrismaHorario & { sourceUrl: string };

interface HomePageProps {
  horarios: HorarioComFonte[]; // Usamos nosso novo tipo
  error?: string;
}

// Mapa de rotas para URLs de fonte.
// A CHAVE deve ser "origem-destino" em letras minúsculas.
const fontesDasRotas: Record<string, string> = {
  // Rotas da RibeTransporte
  "ribeirão preto-jardinópolis": "https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/",
  "jardinópolis-ribeirão preto": "https://www.ribetransporte.com.br/linha-01/",
  
  // Rotas de OCR (VSB)
  "barrinha-sertãozinho": "https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg",
  "sertãozinho-barrinha": "https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg",
  
  "batatais-altinópolis": "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg",
  "altinópolis-batatais": "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg",
  
  // Adicione TODAS as outras rotas aqui no mesmo formato...
  // Ex: "cidade a-cidade b": "url_da_fonte_aqui"
};

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const horariosDoBanco = await prisma.horario.findMany({
      orderBy: { horario: 'asc' },
    });

    // A MÁGICA ACONTECE AQUI:
    // Injetamos a URL da fonte em cada horário.
    const horariosComFonteInjetada = horariosDoBanco.map(horario => {
      const chaveDaRota = `${horario.origem.toLowerCase()}-${horario.destino.toLowerCase()}`;
      const sourceUrl = fontesDasRotas[chaveDaRota] || ""; // Pega a URL do nosso mapa

      return {
        ...horario,
        sourceUrl: sourceUrl,
      };
    });

    return {
      props: {
        horarios: horariosComFonteInjetada,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Erro em getStaticProps:", error);
    return { props: { horarios: [], error: "Erro ao carregar dados." }, revalidate: 60 };
  }
};

// O componente da página não muda
export default function HomePage({ horarios, error }: HomePageProps) {
  if (error) {
    return <p className="p-4 text-center text-red-500">{error}</p>;
  }
  return (
    <div className="p-4 md:p-6 pb-20">
      <BusScheduleFilter schedules={horarios} />
    </div>
  );
}