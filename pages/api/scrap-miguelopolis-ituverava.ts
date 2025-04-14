import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg";

    await processarRaspagemOCR(imagemURL, "Miguelópolis", "Ituverava", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Miguelópolis", "Ituverava", "Sábado, Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Ituverava", "Miguelópolis", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Ituverava", "Miguelópolis", "Sábado, Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Miguelópolis - Ituverava concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}