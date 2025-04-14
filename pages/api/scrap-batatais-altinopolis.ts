import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg";

    await processarRaspagemOCR(imagemURL, "Batatais", "Altinópolis", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Batatais", "Altinópolis", "Sábado");
    await processarRaspagemOCR(imagemURL, "Batatais", "Altinópolis", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Altinópolis", "Batatais", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Altinópolis", "Batatais", "Sábado");
    await processarRaspagemOCR(imagemURL, "Altinópolis", "Batatais", "Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Batatais - Altinópolis concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}