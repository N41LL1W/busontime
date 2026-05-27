import type { NextApiRequest, NextApiResponse } from "next";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const config = { api: { responseLimit: false } };

function runPython(origem: string, destino: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
    const scriptPath = path.join(process.cwd(), "scraper_saobento.py");

    const child = spawn(pythonPath, [
      "-W", "ignore",
      scriptPath,
      "--origem", origem,
      "--destino", destino,
    ], {
      cwd: process.cwd(),
      env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUTF8: "1" },
    });

    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr || `Python saiu com código ${code}`));
    });
    child.on("error", reject);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { origem, destino } = req.body;
  if (!origem || !destino) return res.status(400).json({ error: "origem e destino obrigatórios" });

  const outputPath = path.join(process.cwd(), "public", "horarios-saobento.json");

  try {
    await runPython(origem, destino);
    const raw = fs.readFileSync(outputPath, "utf-8");
    const dados = JSON.parse(raw);

    const saveRes = await fetch(`http://localhost:${process.env.PORT ?? 3000}/api/admin/salvar-horarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origem, destino, ...dados }),
    });
    return res.status(200).json(await saveRes.json());
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
