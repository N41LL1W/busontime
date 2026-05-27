import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const { origem, destino, dia } = req.query;

    const rotas = await prisma.rota.findMany({
      where: {
        ativo: true,
        ...(origem ? { origem: String(origem) } : {}),
        ...(destino ? { destino: String(destino) } : {}),
      },
      include: {
        empresa: { select: { nome: true, slug: true, sourceUrl: true } },
        horarios: {
          where: {
            ativo: true,
            ...(dia ? { diaDaSemana: String(dia) } : {}),
          },
          orderBy: { horario: 'asc' },
        },
      },
      orderBy: [{ origem: 'asc' }, { destino: 'asc' }],
    });

    return res.status(200).json(rotas);
  } catch (error) {
    console.error('Erro na API de horários:', error);
    return res.status(500).json({ message: 'Erro ao carregar horários.' });
  }
}
