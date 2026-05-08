// pages/api/horarios.ts
import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

const normalizeTarifa = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const getHorarioPayload = (body: NextApiRequest['body']) => {
  const origem = normalizeText(body?.origem);
  const destino = normalizeText(body?.destino);
  const diaDaSemana = normalizeText(body?.diaDaSemana);
  const horario = normalizeText(body?.horario);
  const observacao = normalizeText(body?.observacao);
  const tarifa = normalizeTarifa(body?.tarifa);

  if (!origem || !destino || !diaDaSemana || !horario) {
    return { error: 'Preencha origem, destino, dia da semana e horário.' };
  }

  if (!/^\d{1,2}:\d{2}$/.test(horario)) {
    return { error: 'Informe o horário no formato HH:mm.' };
  }

  return {
    data: {
      origem,
      destino,
      diaDaSemana,
      horario,
      tarifa,
      observacao: observacao || null,
    },
  };
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const horarios = await prisma.horario.findMany({
        orderBy: [{ origem: 'asc' }, { destino: 'asc' }, { diaDaSemana: 'asc' }, { horario: 'asc' }],
      });
      return res.status(200).json(horarios);
    }

    if (req.method === 'POST') {
      const payload = getHorarioPayload(req.body);
      if ('error' in payload) return res.status(400).json({ message: payload.error });

      const horario = await prisma.horario.create({ data: payload.data });
      return res.status(201).json({ message: 'Horário cadastrado com sucesso.', horario });
    }

    if (req.method === 'PUT') {
      const id = Number(req.body?.id);
      if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID inválido.' });

      const payload = getHorarioPayload(req.body);
      if ('error' in payload) return res.status(400).json({ message: payload.error });

      const horario = await prisma.horario.update({ where: { id }, data: payload.data });
      return res.status(200).json({ message: 'Horário atualizado com sucesso.', horario });
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query.id ?? req.body?.id);
      if (!Number.isInteger(id)) return res.status(400).json({ message: 'ID inválido.' });

      await prisma.horario.delete({ where: { id } });
      return res.status(200).json({ message: 'Horário removido com sucesso.' });
    }

    return res.status(405).json({ message: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de horários:', error);
    return res.status(500).json({ message: 'Erro ao processar horários.' });
  }
}
