// pages/api/reset-db.ts
import prisma from '../../lib/prisma';
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // SÓ RODA EM AMBIENTE DE DESENVOLVIMENTO!
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: "Acesso proibido." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }
  // ... resto do seu código
}