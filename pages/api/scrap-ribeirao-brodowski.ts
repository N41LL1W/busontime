import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg";

    // Ribeirão Preto → Brodowski
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Brodowski", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Brodowski", "Sábado");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Brodowski", "Domingo e Feriados");

    // Brodowski → Ribeirão Preto
    await processarRaspagemOCR(imagemURL, "Brodowski", "Ribeirão Preto", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Brodowski", "Ribeirão Preto", "Sábado");
    await processarRaspagemOCR(imagemURL, "Brodowski", "Ribeirão Preto", "Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Ribeirão-Brodowski concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}
