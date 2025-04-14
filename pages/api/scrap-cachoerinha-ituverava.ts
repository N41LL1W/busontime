import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg";

    await processarRaspagemOCR(imagemURL, "São Benedito da Cachoerinha", "Ituverava", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "São Benedito da Cachoerinha", "Ituverava", "Sábados, Domingos e Feriados");

    await processarRaspagemOCR(imagemURL, "Ituverava", "São Benedito da Cachoerinha", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Ituverava", "São Benedito da Cachoerinha", "Sábados, Domingos e Feriados");

    res.status(200).json({ message: "Raspagem São Benedito da Cachoerinha - Ituverava concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}