import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Horario = { horario: string; tipo: "rodoviaria" | "intermediario" };
type Sentido = { diaDaSemana: string; origem: string; destino: string; horarios: Horario[] };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { origem, destino, linha, tarifas, sentidos } = req.body;
  if (!origem || !destino || !sentidos) return res.status(400).json({ error: "Dados incompletos" });

  try {
    // Garante que a empresa existe
    const empresa = await prisma.empresa.upsert({
      where: { slug: "saobento" },
      update: {},
      create: {
        nome: "Viação São Bento",
        slug: "saobento",
        sourceUrl: "https://semiurbano.lovable.app/horarios",
      },
    });

    // Tarifas
    const tarifaComum = tarifas?.find((t: { tipo: string; valor: string }) =>
      t.tipo.toLowerCase().includes("comum"))?.valor?.replace(/[^\d,]/g, "").replace(",", ".") ?? null;
    const tarifaEstudante = tarifas?.find((t: { tipo: string; valor: string }) =>
      t.tipo.toLowerCase().includes("estudante"))?.valor?.replace(/[^\d,]/g, "").replace(",", ".") ?? null;

    // Upsert da rota
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

    // Apaga horários antigos da rota e insere novos
    await prisma.horario.deleteMany({ where: { rotaId: rota.id } });

    let total = 0;
    for (const sentido of sentidos as Sentido[]) {
      const sentidoStr = sentido.origem === origem ? "ida" : "volta";
      for (const h of sentido.horarios) {
        await prisma.horario.create({
          data: {
            rotaId: rota.id,
            horario: h.horario,
            diaDaSemana: sentido.diaDaSemana,
            sentido: sentidoStr,
            tipo: h.tipo,
          },
        });
        total++;
      }
    }

    // Log
    await prisma.logRaspagem.create({
      data: {
        origem,
        destino,
        empresaSlug: "saobento",
        status: "sucesso",
        totalHorarios: total,
      },
    });

    return res.status(200).json({ message: `${total} horários salvos para ${origem} → ${destino}`, total });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.logRaspagem.create({
      data: { origem, destino, empresaSlug: "saobento", status: "erro", totalHorarios: 0, erro: msg },
    }).catch(() => {});
    return res.status(500).json({ error: msg });
  } finally {
    await prisma.$disconnect();
  }
}
