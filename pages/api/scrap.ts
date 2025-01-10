import { NextApiRequest, NextApiResponse } from 'next';
import cheerio from 'cheerio';
import axios from 'axios';
import prisma from '../../lib/prisma';

const SITE_URL = 'https://www.ribetransporte.com.br/linha-01/'; // Substitua pelo URL do site a ser raspado

const scrapeHorarios = async () => {
  try {
    const { data } = await axios.get(SITE_URL);
    const $ = cheerio.load(data);

    const horarios = [];

    $('table tr').each((_, element) => {
      const origem = $(element).find('td:nth-child(1)').text().trim();
      const destino = $(element).find('td:nth-child(2)').text().trim();
      const horario = $(element).find('td:nth-child(3)').text().trim();
      const diaDaSemana = $(element).find('td:nth-child(4)').text().trim();
      const observacao = $(element).find('td:nth-child(5)').text().trim() || null;

      if (origem && destino && horario && diaDaSemana) {
        horarios.push({ origem, destino, horario, diaDaSemana, observacao });
      }
    });

    return horarios;
  } catch (error) {
    console.error('Erro ao raspar dados:', error);
    throw new Error('Erro na raspagem de dados');
  }
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') {
    try {
      // Raspagem de dados do site
      const horarios = await scrapeHorarios();

      // Atualiza o banco de dados
      await prisma.horario.deleteMany(); // Limpa a tabela
      await prisma.horario.createMany({ data: horarios }); // Insere os novos dados

      res.status(200).json({ message: 'Horários atualizados com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao atualizar os horários' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
};

export default handler;
