import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";

type Horario = {
  horario: string;
  tipo: "rodoviaria" | "intermediario";
};

type Sentido = {
  diaDaSemana: string;
  origem: string;
  destino: string;
  horarios: Horario[];
};

type BodySaoBento = {
  origem: string;
  destino: string;
  linha: string;
  tarifas: Array<{ tipo: string; valor: string }>;
  sentidos: Sentido[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const body = req.body as BodySaoBento;
  if (!body?.sentidos?.length) return res.status(400).json({ error: "Dados incompletos" });

  const { origem, destino, linha, tarifas, sentidos } = body;

  try {
    const empresa = await prisma.empresa.upsert({
      where: { slug: "saobento" },
      update: {},
      create: {
        nome: "Viação São Bento",
        slug: "saobento",
        sourceUrl: "https://semiurbano.lovable.app/horarios",
      },
    });

    const tarifaComum = tarifas?.find((t) =>
      t.tipo.toLowerCase().includes("comum"))?.valor
      ?.replace(/[^\d,]/g, "").replace(",", ".") ?? null;
    const tarifaEstudante = tarifas?.find((t) =>
      t.tipo.toLowerCase().includes("estudante"))?.valor
      ?.replace(/[^\d,]/g, "").replace(",", ".") ?? null;

    const rota = await prisma.rota.upsert({
      where: { empresaId_origem_destino: { empresaId: empresa.id, origem, destino } },
      update: {
        linha: linha ?? undefined,
        tarifaComum: tarifaComum ? parseFloat(tarifaComum) : undefined,
        tarifaEstudante: tarifaEstudante ? parseFloat(tarifaEstudante) : undefined,
        atualizadoEm: new Date(),
      },
      create: {
        empresaId: empresa.id,
        origem,
        destino,
        linha: linha ?? `${origem} X ${destino}`,
        tarifaComum: tarifaComum ? parseFloat(tarifaComum) : null,
        tarifaEstudante: tarifaEstudante ? parseFloat(tarifaEstudante) : null,
      },
    });

    await prisma.$transaction([
      prisma.horario.deleteMany({ where: { rotaId: rota.id } }),
    ]);

    let total = 0;
    for (const sentido of sentidos) {
      const sentidoStr = sentido.origem === origem ? "ida" : "volta";
      if (sentido.horarios.length > 0) {
        await prisma.horario.createMany({
          data: sentido.horarios.map((h) => ({
            rotaId: rota.id,
            horario: h.horario,
            diaDaSemana: sentido.diaDaSemana,
            sentido: sentidoStr,
            tipo: h.tipo,
          })),
          skipDuplicates: true,
        });
        total += sentido.horarios.length;
      }
    }

    return res.status(200).json({ message: `${total} horários salvos`, total });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  } finally {
    await prisma.$disconnect();
  }
}