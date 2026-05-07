import type { NextApiRequest, NextApiResponse } from 'next';

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { login, senha } = req.body || {};

  if (login === adminUser && senha === adminPassword) {
    return res.status(200).json({ message: 'Login realizado com sucesso.' });
  }

  return res.status(401).json({ message: 'Login ou senha incorretos.' });
}
