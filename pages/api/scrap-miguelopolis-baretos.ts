import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagemOCR from "../../scrape/processarRaspagemOCR";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  try {
    const imagemURL = "https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg";

    await processarRaspagemOCR(imagemURL, "Miguelópolis", "Guaíra", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Miguelópolis", "Guaíra", "Sábado");
    await processarRaspagemOCR(imagemURL, "Miguelópolis", "Guaíra", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Guaíra", "Miguelópolis", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Guaíra", "Miguelópolis", "Sábado");
    await processarRaspagemOCR(imagemURL, "Guaíra", "Miguelópolis", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Miguelópolis", "Baretos", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Miguelópolis", "Baretos", "Sábado");
    await processarRaspagemOCR(imagemURL, "Miguelópolis", "Baretos", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Baretos", "Miguelópolis", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Baretos", "Miguelópolis", "Sábado");
    await processarRaspagemOCR(imagemURL, "Baretos", "Miguelópolis", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Guaíra", "Baretos", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Guaíra", "Baretos", "Sábado");
    await processarRaspagemOCR(imagemURL, "Guaíra", "Baretos", "Domingo e Feriados");

    await processarRaspagemOCR(imagemURL, "Baretos", "Guaíra", "Segunda à Sexta");
    await processarRaspagemOCR(imagemURL, "Baretos", "Guaíra", "Sábado");
    await processarRaspagemOCR(imagemURL, "Baretos", "Guaíra", "Domingo e Feriados");

    res.status(200).json({ message: "Raspagem Miguelópolis - Baretos (via Guaíra) concluída com sucesso!" });
  } catch (error) {
    console.error("Erro na raspagem OCR:", error);
    res.status(500).json({ message: "Erro ao processar a raspagem OCR." });
  }
}