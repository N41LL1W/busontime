import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Horario = { horario: string; tipo: "rodoviaria" | "intermediario" };
type Sentido = { diaDaSemana: string; origem: string; destino: string; horarios: Horario[] };

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

    // ── Agrupa os "sentidos" retornados pelo scraper por PAR (origem,destino) real ──
    // Cada direção vira sua PRÓPRIA rota no banco, com sentido "ida" — assim as duas
    // direções ficam sempre visíveis, independente de qual foi pedida na busca.
    const grupos = new Map<string, { origem: string; destino: string; horarios: Array<Horario & { diaDaSemana: string }> }>();

    for (const sentido of sentidos as Sentido[]) {
      const chave = `${normalizar(sentido.origem)}→${normalizar(sentido.destino)}`;
      if (!grupos.has(chave)) {
        grupos.set(chave, { origem: sentido.origem, destino: sentido.destino, horarios: [] });
      }
      const grupo = grupos.get(chave)!;
      for (const h of sentido.horarios) {
        grupo.horarios.push({ ...h, diaDaSemana: sentido.diaDaSemana });
      }
    }

    let total = 0;
    const rotasSalvas: string[] = [];

    for (const grupo of grupos.values()) {
      const ehParPrincipal =
        normalizar(grupo.origem) === normalizar(origem) && normalizar(grupo.destino) === normalizar(destino);

      const updateData: Record<string, unknown> = { atualizadoEm: new Date() };
      if (linha) updateData.linha = linha;
      if (tarifaComum !== null) updateData.tarifaComum = tarifaComum;
      if (tarifaEstudante !== null) updateData.tarifaEstudante = tarifaEstudante;

      const rota = await prisma.rota.upsert({
        where: {
          empresaId_origem_destino: {
            empresaId: empresa.id,
            origem: grupo.origem,
            destino: grupo.destino,
          },
        },
        update: updateData,
        create: {
          empresaId: empresa.id,
          origem: grupo.origem,
          destino: grupo.destino,
          linha: linha ?? `${grupo.origem} X ${grupo.destino}`,
          tarifaComum,
          tarifaEstudante,
        },
      });

      await prisma.horario.deleteMany({ where: { rotaId: rota.id } });

      if (grupo.horarios.length > 0) {
        await prisma.horario.createMany({
          data: grupo.horarios.map((h) => ({
            rotaId: rota.id,
            horario: h.horario,
            diaDaSemana: h.diaDaSemana,
            sentido: "ida",
            tipo: h.tipo,
          })),
          skipDuplicates: true,
        });
        total += grupo.horarios.length;
      }

      rotasSalvas.push(`${grupo.origem} → ${grupo.destino}${ehParPrincipal ? "" : " (reversa)"}`);
    }

    return res.status(200).json({
      message: `${total} horários salvos em ${grupos.size} rota(s): ${rotasSalvas.join("; ")}`,
      total,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: msg });
  } finally {
    await prisma.$disconnect();
  }
}