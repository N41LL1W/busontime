// pages/api/reset-db.ts
import prisma from '../../lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'A limpeza total do banco só é permitida em desenvolvimento.' });
  }

  try {
    const result = await prisma.horario.deleteMany();
    return res.status(200).json({ message: `${result.count} horários removidos do banco de dados.` });
  } catch (error) {
    return res.status(500).json({
      message: error instanceof Error ? error.message : 'Erro ao resetar o banco de dados.',
    });
  }
}
