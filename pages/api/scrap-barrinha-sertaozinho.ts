import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg";

    await processarRaspagemOCR(imagemURL, "Barrinha", "Sertãozinho", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Barrinha", "Sertãozinho", "Sábado");
    await processarRaspagemOCR(imagemURL, "Barrinha", "Sertãozinho", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Sertãozinho", "Barrinha", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Sertãozinho", "Barrinha", "Sábado");
    await processarRaspagemOCR(imagemURL, "Sertãozinho", "Barrinha", "Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Barrinha - Sertãozinho concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}