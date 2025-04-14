import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg";

    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Sertãozinho", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Sertãozinho", "Sábado");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Sertãozinho", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Sertãozinho", "Ribeirão Preto", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Sertãozinho", "Ribeirão Preto", "Sábado");
    await processarRaspagemOCR(imagemURL, "Sertãozinho", "Ribeirão Preto", "Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Ribeirão-Sertãozinho concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}