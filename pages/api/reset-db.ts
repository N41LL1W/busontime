// pages/api/reset-db.ts
import prisma from '../../lib/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ message: 'Acesso proibido fora do ambiente de desenvolvimento.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const result = await prisma.horario.deleteMany();
    return res.status(200).json({ message: `${result.count} horários foram removidos do banco.` });
  } catch (error) {
    console.error('Erro ao resetar banco:', error);
    return res.status(500).json({ message: 'Erro ao resetar o banco de dados.' });
  }
}
