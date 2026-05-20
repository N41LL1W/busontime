import type { NextApiRequest, NextApiResponse } from "next";
import {
  testarRaspagemSemiurbanoTodasAsRotas,
  type SemiurbanoTesteLoteResultado,
} from "../../scrapers/puppeteer-semiurbano";

export const config = {
  api: {
    responseLimit: false,
  },
  maxDuration: 60,
};

type TesteSemiurbanoResponse =
  | ({ ok: true } & SemiurbanoTesteLoteResultado)
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TesteSemiurbanoResponse>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Use POST para iniciar o teste de raspagem." });
  }

  try {
    const resultado = await testarRaspagemSemiurbanoTodasAsRotas();
    return res.status(200).json({ ok: true, ...resultado });
  } catch (error) {
    console.error("[Teste Semiurbano] Erro ao executar automação:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Erro desconhecido ao executar teste.",
    });
  }
}