import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import prisma from "../../../lib/prisma";

export const config = { api: { responseLimit: false } };

function runPython(): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
    const scriptPath = path.join(process.cwd(), "scraper_rapidodoeste.py");
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

type HorarioItem = {
  horario: string;
  diaDaSemana: string;
  sentido: string;
  tipo?: string;
  observacao?: string | null;
};

type RotaItem = {
  origem: string;
  destino: string;
  sentido: string;
  tarifa: number | null;
  horarios: HorarioItem[];
};

type LinhaItem = {
  codigo: string;
  nome: string;
  tarifa: number | null;
  rotas: RotaItem[];
  erro?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const outputPath = path.join(process.cwd(), "public", "horarios-rapidodoeste.json");

  try {
    console.log("[scrape-rapidodoeste] Iniciando scraper Python...");
    await runPython();

    const raw = fs.readFileSync(outputPath, "utf-8");
    const dados = JSON.parse(raw);

    const emp = await prisma.empresa.upsert({
      where: { slug: "rapidodoeste" },
      update: { sourceUrl: dados.sourceUrl },
      create: {
        nome: dados.empresa,
        slug: "rapidodoeste",
        sourceUrl: dados.sourceUrl,
      },
    });

    let totalHorarios = 0;
    let totalRotas = 0;
    const erros: string[] = [];

    for (const linha of dados.linhas as LinhaItem[]) {
      if (linha.erro) {
        erros.push(`${linha.codigo}: ${linha.erro}`);
        continue;
      }

      for (const rota of linha.rotas) {
        if (!rota.horarios?.length) continue;

        try {
          // Prioriza tarifa da rota específica; se não tiver, usa a tarifa geral da linha.
          // Só sobrescreve o banco se algum dos dois tiver um valor real —
          // isso evita apagar uma tarifa boa anterior quando a raspagem atual falha.
          const tarifaNova = rota.tarifa ?? linha.tarifa ?? null;

          const updateData: Record<string, unknown> = {
            linha: linha.nome,
            atualizadoEm: new Date(),
          };
          if (tarifaNova !== null) updateData.tarifaComum = tarifaNova;

          const rotaDb = await prisma.rota.upsert({
            where: {
              empresaId_origem_destino: {
                empresaId: emp.id,
                origem: rota.origem,
                destino: rota.destino,
              },
            },
            update: updateData,
            create: {
              empresaId: emp.id,
              origem: rota.origem,
              destino: rota.destino,
              linha: linha.nome,
              tarifaComum: tarifaNova,
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
          totalRotas++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          erros.push(`${linha.codigo} ${rota.origem}→${rota.destino}: ${msg}`);
        }
      }
    }

    await prisma.logRaspagem.create({
      data: {
        origem: "múltiplas",
        destino: "múltiplas",
        empresaSlug: "rapidodoeste",
        status: "sucesso",
        totalHorarios,
        erro: erros.length > 0 ? erros.slice(0, 5).join("; ") : null,
      },
    });

    return res.status(200).json({
      message: `${totalHorarios} horários salvos em ${totalRotas} rotas da Rápido d'Oeste`,
      total: totalHorarios,
      rotas: totalRotas,
      erros: erros.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[scrape-rapidodoeste] erro:", msg);
    return res.status(500).json({ error: msg });
  } finally {
    await prisma.$disconnect();
  }
}