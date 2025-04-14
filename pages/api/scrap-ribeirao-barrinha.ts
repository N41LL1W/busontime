import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg";

    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Barrinha", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Barrinha", "Sábado");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Barrinha", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Barrinha", "Ribeirão Preto", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Barrinha", "Ribeirão Preto", "Sábado");
    await processarRaspagemOCR(imagemURL, "Barrinha", "Ribeirão Preto", "Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Ribeirão Preto - Barrinha concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}