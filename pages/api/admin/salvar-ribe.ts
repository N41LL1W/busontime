import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Horario = {
  horario: string;
  diaDaSemana: string;
  sentido: string;
  tipo: string;
  observacao?: string | null;
};

type RotaRibe = {
  url: string;
  origem: string;
  destino: string;
  sentido: string;
  tarifa: number | null;
  horarios: Horario[];
};

type Body = {
  empresa: string;
  linha: string;
  sourceUrl: string;
  rotas: RotaRibe[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { empresa, linha, sourceUrl, rotas } = req.body as Body;
  if (!rotas?.length) return res.status(400).json({ error: "Sem rotas para salvar" });

  try {
    // Upsert empresa
    const emp = await prisma.empresa.upsert({
      where: { slug: "ribe" },
      update: { sourceUrl },
      create: { nome: empresa, slug: "ribe", sourceUrl },
    });

    let totalHorarios = 0;

    for (const rota of rotas) {
      // Upsert rota
      const rotaDb = await prisma.rota.upsert({
        where: { empresaId_origem_destino: { empresaId: emp.id, origem: rota.origem, destino: rota.destino } },
        update: {
          linha,
          tarifaComum: rota.tarifa,
          atualizadoEm: new Date(),
        },
        create: {
          empresaId: emp.id,
          origem: rota.origem,
          destino: rota.destino,
          linha,
          tarifaComum: rota.tarifa,
        },
      });

      // Apaga horários antigos e insere novos
      await prisma.horario.deleteMany({ where: { rotaId: rotaDb.id } });

      for (const h of rota.horarios) {
        await prisma.horario.create({
          data: {
            rotaId: rotaDb.id,
            horario: h.horario,
            diaDaSemana: h.diaDaSemana,
            sentido: h.sentido,
            tipo: h.tipo ?? "rodoviaria",
            observacao: h.observacao ?? null,
          },
        });
        totalHorarios++;
      }
    }

    await prisma.logRaspagem.create({
      data: {
        origem: "Ribeirão Preto",
        destino: "Jardinópolis",
        empresaSlug: "ribe",
        status: "sucesso",
        totalHorarios,
      },
    });

    return res.status(200).json({
      message: `${totalHorarios} horários da Ribe salvos com sucesso`,
      total: totalHorarios,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  } finally {
    await prisma.$disconnect();
  }
}
