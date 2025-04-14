import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg";

    await processarRaspagemOCR(imagemURL, "Serra Azul", "Ribeirão Preto", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Serra Azul", "Ribeirão Preto", "Sábado");
    await processarRaspagemOCR(imagemURL, "Serra Azul", "Ribeirão Preto", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Serra Azul", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Serra Azul", "Sábado");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Serra Azul", "Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Ribeirão Preto - Serra Azul concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}