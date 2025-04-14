// pages/api/reset-db.ts
import prisma from '../../lib/prisma';
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    // Apaga todos os registros
    await prisma.horario.deleteMany();

    // Reseta o contador de IDs (somente funciona com PostgreSQL)
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE "Horario_id_seq" RESTART WITH 1`);

    res.status(200).json({ message: "Banco de dados resetado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao resetar o banco de dados." });
  }
}
