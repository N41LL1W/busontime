import { NextApiRequest, NextApiResponse } from 'next';
import processarRaspagemJaboticabal from '@/scrape/processarRaspagemJaboticabal'; // ajuste o path se necessário

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const url = "https://www.jaboticabal.sp.gov.br/horario-de-onibus"; // coloque o link correto aqui
    await processarRaspagemJaboticabal(url, "Jaboticabal");
    res.status(200).json({ message: 'Raspagem concluída com sucesso!' });
  } catch (error: any) {
    console.error("Erro ao processar raspagem:", error);
    res.status(500).json({ message: 'Erro interno ao processar raspagem', error: error.message });
  }
}
