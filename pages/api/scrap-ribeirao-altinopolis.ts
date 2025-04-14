import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg";

    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Altinópolis", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Ribeirão Preto", "Altinópolis", "Sábados, Domingos e Feriados");

    await processarRaspagemOCR(imagemURL, "Altinópolis", "Ribeirão Preto", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Altinópolis", "Ribeirão Preto", "Sábados, Domingos e Feriados");

    res.status(200).json({ message: "Raspagem Ribeirão Preto - Altinópolis concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}