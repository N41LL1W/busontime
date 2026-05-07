// pages/api/reset-db.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const result = await prisma.horario.deleteMany();
    return res.status(200).json({ message: `Banco resetado com sucesso. ${result.count} horários removidos.` });
  } catch (error) {
    console.error('[Reset DB] Erro ao limpar horários:', error);
    return res.status(500).json({ message: 'Erro ao resetar o banco de dados.' });
  }
}
