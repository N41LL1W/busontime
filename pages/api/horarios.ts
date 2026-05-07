//pages/api/horarios.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';
import { getRouteSourceUrl } from '@/lib/routeSources';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const horarios = await prisma.horario.findMany({
        orderBy: { horario: 'asc' },
      });
      const horariosComFonte = horarios.map((horario) => ({
        ...horario,
        sourceUrl: getRouteSourceUrl(horario),
      }));
      res.status(200).json(horariosComFonte);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar horários' });
    }
  } else {
    res.status(405).json({ message: 'Método não permitido' });
  }
}
