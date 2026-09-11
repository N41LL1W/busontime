import React from "react";
import Head from "next/head";
import { GetStaticProps } from "next";
import path from "path";
import fs from "fs";
import prisma from "../lib/prisma";
import BusScheduleFilter from "../components/BusScheduleFilter";
import AdBanner from "@/components/Adbanner";

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
  let rotasMapa: Record<string, string[]> = {};

  try {
    const jsonPath = path.join(process.cwd(), "public", "rotas-saobento.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    rotasMapa = JSON.parse(raw).mapa ?? {};
  } catch {
    // ignora se não existir
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

    for (const rota of rotas) {
      if (!rotasMapa[rota.origem]) rotasMapa[rota.origem] = [];
      if (!rotasMapa[rota.origem].includes(rota.destino)) {
        rotasMapa[rota.origem].push(rota.destino);
      }
    }
    for (const origem of Object.keys(rotasMapa)) {
      rotasMapa[origem].sort();
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

  // Lista das empresas realmente presentes nos dados, pra montar o texto descritivo
  // dinamicamente (sempre renderizado no servidor, nunca depende de hidratação).
  const empresas = Array.from(new Set(horarios.map((h) => h.empresaNome))).sort();
  const totalRotas = new Set(horarios.map((h) => `${h.origem}|${h.destino}`)).size;

  return (
    <>
      <Head>
        <title>BusOnTime — Horários de Ônibus</title>
        <meta
          name="description"
          content="Horários de ônibus suburbanos entre Ribeirão Preto e municípios da região: Brodowski, Jardinópolis, Cravinhos, Serrana, Sertãozinho e mais. Consulte horários e tarifas atualizados."
        />
      </Head>
      <div className="flex flex-col items-center w-full p-4 md:p-6 pb-24">
        <div className="w-full max-w-3xl">

          {/* Conteúdo descritivo real, sempre presente no HTML gerado pelo servidor
              (getStaticProps), independente de JavaScript ou hidratação no navegador. */}
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-bold text-foreground">
              Horários de Ônibus Suburbanos — Região de Ribeirão Preto
            </h1>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              O BusOnTime reúne, em um só lugar, os horários oficiais das linhas de
              ônibus suburbanos que ligam Ribeirão Preto às cidades vizinhas.
              Atualmente cobrimos {totalRotas} rotas operadas por{" "}
              {empresas.length > 0 ? empresas.join(", ") : "diversas empresas de transporte"}.
              Selecione abaixo a origem, o destino e o horário desejado para ver os
              próximos ônibus disponíveis, tarifas e itinerários completos.
            </p>
          </div>

          <div className="mb-5 text-center md:text-left">
            <h2 className="text-xl font-semibold text-foreground">
              Encontre seu próximo ônibus
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selecione a data, hora, origem e destino para ver os horários disponíveis.
            </p>
          </div>

          <BusScheduleFilter schedules={horarios} rotasMapa={rotasMapa} />

          {/* Bloco de texto adicional, real e estático, reforçando conteúdo
              substantivo abaixo dos resultados — ajuda tanto o usuário quanto
              a análise de conteúdo do AdSense. */}
          <div className="mt-8 rounded-2xl border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground mb-2">
              Sobre os horários suburbanos
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os horários exibidos são coletados diretamente dos sites oficiais das
              empresas de transporte e atualizados regularmente. Cada rota mostra o
              horário de saída, a empresa responsável, a tarifa (quando disponível) e
              um link para a página completa com o itinerário e o comparativo entre
              empresas, caso mais de uma opere o mesmo trajeto. Você também pode
              configurar alarmes para ser avisado antes do horário de saída do seu
              ônibus.
            </p>
          </div>

          {/* Anúncio só aparece DEPOIS de conteúdo real e substantivo (texto
              descritivo + a própria ferramenta de busca), nunca antes dele. */}
          <div className="mt-8 w-full flex justify-center">
            <AdBanner slot="5149715430" className="my-2" />
          </div>
        </div>
      </div>
    </>
  );
}