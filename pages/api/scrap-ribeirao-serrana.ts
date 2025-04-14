import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg";

    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Serrana", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Serrana", "Sábado");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Serrana", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Serrana", "Ribeirão Preto", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Serrana", "Ribeirão Preto", "Sábado");
    await processarRaspagemOCR(imagemURL, "Serrana", "Ribeirão Preto", "Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Ribeirão-Serrana concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}
