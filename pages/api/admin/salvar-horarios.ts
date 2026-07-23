import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Horario = { horario: string; tipo: "rodoviaria" | "intermediario" };
type Sentido = { diaDaSemana: string; origem: string; destino: string; horarios: Horario[] };

// Normaliza texto pra comparar sem depender de acento/espaço (corrige bug de ida/volta trocados)
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { origem, destino, linha, tarifas, sentidos } = req.body;
  if (!origem || !destino || !sentidos) return res.status(400).json({ error: "Dados incompletos" });

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

    const tarifaComumStr = tarifas?.find((t: { tipo: string; valor: string }) =>
      t.tipo.toLowerCase().includes("comum"))?.valor?.replace(/[^\d,]/g, "").replace(",", ".") ?? null;
    const tarifaEstudanteStr = tarifas?.find((t: { tipo: string; valor: string }) =>
      t.tipo.toLowerCase().includes("estudante"))?.valor?.replace(/[^\d,]/g, "").replace(",", ".") ?? null;

    const tarifaComum = tarifaComumStr ? parseFloat(tarifaComumStr) : null;
    const tarifaEstudante = tarifaEstudanteStr ? parseFloat(tarifaEstudanteStr) : null;

    // Monta o update SEM sobrescrever tarifa com null caso essa raspagem não tenha capturado
    const updateData: Record<string, unknown> = {
      linha: linha ?? undefined,
      atualizadoEm: new Date(),
    };
    if (tarifaComum !== null) updateData.tarifaComum = tarifaComum;
    if (tarifaEstudante !== null) updateData.tarifaEstudante = tarifaEstudante;

    const rota = await prisma.rota.upsert({
      where: { empresaId_origem_destino: { empresaId: empresa.id, origem, destino } },
      update: updateData,
      create: {
        empresaId: empresa.id,
        origem,
        destino,
        linha: linha ?? `${origem} X ${destino}`,
        tarifaComum,
        tarifaEstudante,
      },
    });

    await prisma.horario.deleteMany({ where: { rotaId: rota.id } });

    const origemNorm = normalizar(origem);
    let total = 0;

    for (const sentido of sentidos as Sentido[]) {
      // Comparação normalizada — corrige rotas onde acento/espaço fazia
      // a comparação falhar e tudo virar "volta" incorretamente
      const sentidoStr = normalizar(sentido.origem) === origemNorm ? "ida" : "volta";
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