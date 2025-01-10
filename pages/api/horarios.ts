import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'GET') {
    try {
      const horarios = await prisma.horario.findMany();
      res.status(200).json(horarios);
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar horários' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
};

export default handler;
