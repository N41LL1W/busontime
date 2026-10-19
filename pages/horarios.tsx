// pages/horarios.tsx
import React from "react";
import Head from "next/head";
import { GetStaticProps } from "next";
import path from "path";
import fs from "fs";
import prisma from "@/lib/prisma";
import BusScheduleFilter from "@/components/BusScheduleFilter";
import type { HorarioFlat } from "@/pages/index";

interface HorariosPageProps {
  horarios: HorarioFlat[];
  rotasMapa: Record<string, string[]>;
  error?: string;
}

export const getStaticProps: GetStaticProps<HorariosPageProps> = async () => {
  let rotasMapa: Record<string, string[]> = {};
  try {
    const jsonPath = path.join(process.cwd(), "public", "rotas-saobento.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    rotasMapa = JSON.parse(raw).mapa ?? {};
  } catch {}

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

    for (const rota of rotas) {
      if (!rotasMapa[rota.origem]) rotasMapa[rota.origem] = [];
      if (!rotasMapa[rota.origem].includes(rota.destino)) {
        rotasMapa[rota.origem].push(rota.destino);
      }
    }

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

    return { props: { horarios, rotasMapa }, revalidate: 3600 };
  } catch (error) {
    return { props: { horarios: [], rotasMapa, error: "Erro ao carregar dados." } };
  }
};

export default function HorariosPage({ horarios, rotasMapa, error }: HorariosPageProps) {
  return (
    <>
      <Head>
        <title>Consulta de Horários — BusOnTime</title>
      </Head>
      <div className="flex flex-col items-center w-full p-4 md:p-6 pb-24 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Consulta de Horários Intermunicipais</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Selecione a origem e o destino para verificar as próximas saídas.
        </p>
        <BusScheduleFilter schedules={horarios} rotasMapa={rotasMapa} />
      </div>
    </>
  );
}