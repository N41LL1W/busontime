import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg";

    await processarRaspagemOCR(imagemURL, "Brodowski", "Batatais", "Segunda à Sexta");

    await processarRaspagemOCR(imagemURL, "Batatais", "Brodowski", "Segunda à Sexta");

    res.status(200).json({ message: "Raspagem Brodowski-Batatais concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}