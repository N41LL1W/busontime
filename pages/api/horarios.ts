import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const horarios = await prisma.horario.findMany(); // Buscando os horários no banco
      res.status(200).json(horarios);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar horários' });
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}
