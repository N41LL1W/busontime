import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import prisma from "../../../lib/prisma";

export const config = { api: { responseLimit: false } };

function runPython(): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
    const scriptPath = path.join(process.cwd(), "scraper_ribe.py");
    const child = spawn(pythonPath, ["-W", "ignore", scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
    });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.stdout.on("data", (d) => { process.stdout.write(d); });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Python saiu com código ${code}`));
    });
    child.on("error", reject);
  });
}

type HorarioRibe = {
  horario: string;
  diaDaSemana: string;
  sentido: string;
  tipo?: string;
  observacao?: string | null;
};

type RotaRibe = {
  origem: string;
  destino: string;
  tarifa: number | null;
  horarios: HorarioRibe[];
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const outputPath = path.join(process.cwd(), "public", "horarios-ribe.json");

  try {
    console.log("[scrape-ribe] Rodando scraper Python...");
    await runPython();

    const raw = fs.readFileSync(outputPath, "utf-8");
    const dados = JSON.parse(raw);

    const emp = await prisma.empresa.upsert({
      where: { slug: "ribe" },
      update: { sourceUrl: dados.sourceUrl },
      create: { nome: dados.empresa, slug: "ribe", sourceUrl: dados.sourceUrl },
    });

    let totalHorarios = 0;

    for (const rota of dados.rotas as RotaRibe[]) {
      if (!rota.horarios?.length) continue;

      // Só atualiza a tarifa se essa raspagem realmente capturou um valor —
      // evita apagar uma tarifa boa anterior quando a raspagem atual falha em achá-la.
      const updateData: Record<string, unknown> = {
        linha: dados.linha,
        atualizadoEm: new Date(),
      };
      if (rota.tarifa !== null && rota.tarifa !== undefined) {
        updateData.tarifaComum = rota.tarifa;
      }

      const rotaDb = await prisma.rota.upsert({
        where: { empresaId_origem_destino: { empresaId: emp.id, origem: rota.origem, destino: rota.destino } },
        update: updateData,
        create: {
          empresaId: emp.id,
          origem: rota.origem,
          destino: rota.destino,
          linha: dados.linha,
          tarifaComum: rota.tarifa ?? null,
        },
      });

      await prisma.horario.deleteMany({ where: { rotaId: rotaDb.id } });

      await prisma.horario.createMany({
        data: rota.horarios.map((h) => ({
          rotaId: rotaDb.id,
          horario: h.horario,
          diaDaSemana: h.diaDaSemana,
          sentido: h.sentido,
          tipo: h.tipo ?? "rodoviaria",
          observacao: h.observacao ?? null,
        })),
        skipDuplicates: true,
      });

      totalHorarios += rota.horarios.length;
    }

    await prisma.logRaspagem.create({
      data: { origem: "Ribeirão Preto", destino: "Jardinópolis", empresaSlug: "ribe", status: "sucesso", totalHorarios },
    });

    return res.status(200).json({ message: `${totalHorarios} horários da Ribe salvos`, total: totalHorarios });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[scrape-ribe] erro:", msg);
    return res.status(500).json({ error: msg });
  } finally {
    await prisma.$disconnect();
  }
}