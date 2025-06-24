import React from "react";
import Head from 'next/head';
import { GetStaticProps } from "next";

import BusScheduleFilter from "../components/BusScheduleFilter";
import prisma from "../lib/prisma";
import type { Horario as PrismaHorario } from "@prisma/client";

// 1. TIPO CUSTOMIZADO: Estende o tipo do Prisma com o nosso campo virtual `sourceUrl`
export type HorarioComFonte = PrismaHorario & { sourceUrl: string };

// 2. PROPS DA PÁGINA: Define o que a nossa página `HomePage` vai receber
interface HomePageProps {
  horarios: HorarioComFonte[];
  error?: string;
}

// 3. MAPA DE FONTES: Nossa "única fonte da verdade" para as URLs de origem
// A CHAVE deve ser "origem-destino" em letras minúsculas.
const fontesDasRotas: Record<string, string> = {
  // Rotas da RibeTransporte
  "ribeirão preto-jardinópolis": "https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/",
  "jardinópolis-ribeirão preto": "https://www.ribetransporte.com.br/linha-01/",
  
  // Rotas de OCR (VSB) - adicione todas aqui. A mesma URL para ida e volta.
  "barrinha-sertãozinho": "https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg",
  "sertãozinho-barrinha": "https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg",
  "batatais-altinópolis": "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg",
  "altinópolis-batatais": "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg",
  
  // ... continue adicionando todas as outras rotas e suas URLs aqui
};

// 4. GETSTATICPROPS: Busca os dados no servidor no momento do build
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const horariosDoBanco = await prisma.horario.findMany({
      orderBy: { horario: 'asc' },
    });

    // Injeta a URL da fonte em cada objeto de horário
    const horariosComFonteInjetada = horariosDoBanco.map(horario => {
      const chaveDaRota = `${horario.origem.toLowerCase()}-${horario.destino.toLowerCase()}`;
      const sourceUrl = fontesDasRotas[chaveDaRota] || ""; // Pega a URL do mapa
      return { ...horario, sourceUrl };
    });

    // Retorna os dados como props para o componente da página
    return {
      props: {
        horarios: horariosComFonteInjetada,
      },
      revalidate: 3600, // Revalida (tenta recriar a página) a cada 1 hora
    };
  } catch (error) {
    console.error("Erro em getStaticProps:", error);
    // Em caso de erro, retorna um array vazio e uma mensagem de erro
    return { 
      props: { 
        horarios: [], 
        error: "Não foi possível carregar os dados do servidor. Tente novamente mais tarde." 
      }, 
      revalidate: 60 // Tenta de novo em 1 minuto
    };
  }
};

// 5. COMPONENTE DA PÁGINA: O conteúdo da aba "Horários"
export default function HomePage({ horarios, error }: HomePageProps) {
  // Se getStaticProps retornou um erro, exibe uma mensagem
  if (error) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-lg font-semibold text-destructive">Oops! Algo deu errado.</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  // Se tudo deu certo, renderiza a página
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

          <BusScheduleFilter schedules={horarios} />
        </div>
      </div>
    </>
  );
}