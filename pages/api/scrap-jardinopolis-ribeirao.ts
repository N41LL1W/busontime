import { NextApiRequest, NextApiResponse } from "next";
import processarRaspagem from "../../scrape/processarRaspagem";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = "https://www.ribetransporte.com.br/linha-01/"; // URL da linha 01
    const origem = "Jardinópolis";
    const destino = "Ribeirão Preto";

    // Chama a função de raspagem passando a URL, origem e destino
    await processarRaspagem(url, origem, destino);
    res.status(200).json({ message: "Raspagem concluída com sucesso!" });
  } catch (error) {
    console.error("Erro durante a raspagem:", error);
    res.status(500).json({ message: error.message });
  }
}
