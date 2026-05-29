import React from "react";
import Head from "next/head";
import { GetStaticProps } from "next";
import path from "path";
import fs from "fs";
import prisma from "../lib/prisma";
import BusScheduleFilter from "../components/BusScheduleFilter";

export type HorarioFlat = {
  id: number;
  rotaId: number;
  horario: string;
  diaDaSemana: string;
  sentido: string;
  tipo: string;
  observacao: string | null;
  origem: string;
  destino: string;
  linha: string | null;
  tarifaComum: number | null;
  tarifaEstudante: number | null;
  empresaNome: string;
  sourceUrl: string | null;
};

interface HomePageProps {
  horarios: HorarioFlat[];
  rotasMapa: Record<string, string[]>;
  error?: string;
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // Mapa de rotas do JSON estático
  let rotasMapa: Record<string, string[]> = {};
  try {
    const jsonPath = path.join(process.cwd(), "public", "rotas-saobento.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    rotasMapa = JSON.parse(raw).mapa ?? {};
  } catch {
    // se não existir, ignora
  }

  try {
    const rotas = await prisma.rota.findMany({
      where: { ativo: true },
      include: {
        empresa: { select: { nome: true, sourceUrl: true } },
        horarios: {
          where: { ativo: true },
          orderBy: { horario: "asc" },
        },
      },
    });

    const horarios: HorarioFlat[] = rotas.flatMap((rota) =>
      rota.horarios.map((h) => ({
        id: h.id,
        rotaId: rota.id,
        horario: h.horario,
        diaDaSemana: h.diaDaSemana,
        sentido: h.sentido,
        tipo: h.tipo,
        observacao: h.observacao,
        origem: rota.origem,
        destino: rota.destino,
        linha: rota.linha,
        tarifaComum: rota.tarifaComum,
        tarifaEstudante: rota.tarifaEstudante,
        empresaNome: rota.empresa.nome,
        sourceUrl: rota.empresa.sourceUrl,
      }))
    );

    return { props: { horarios, rotasMapa } };
  } catch (error) {
    console.error("Erro em getStaticProps:", error);
    return {
      props: {
        horarios: [],
        rotasMapa,
        error: "Não foi possível carregar os dados. Tente novamente mais tarde.",
      },
    };
  }
};

export default function HomePage({ horarios, rotasMapa, error }: HomePageProps) {
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-semibold text-destructive">Algo deu errado.</h2>
        <p className="text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>BusOnTime — Horários de Ônibus</title>
        <meta name="description" content="Encontre os horários de ônibus da sua região de forma fácil e rápida." />
      </Head>
      <div className="flex flex-col items-center w-full p-4 md:p-6 pb-24">
        <div className="w-full max-w-5xl">
          <div className="mb-6 text-center md:text-left">
            <h2 className="text-xl font-semibold text-foreground">Encontre seu próximo ônibus</h2>
            <p className="text-sm text-muted-foreground">
              Selecione a data, hora, origem e destino para ver os horários disponíveis.
            </p>
          </div>
          <BusScheduleFilter schedules={horarios} rotasMapa={rotasMapa} />
        </div>
      </div>
    </>
  );
}