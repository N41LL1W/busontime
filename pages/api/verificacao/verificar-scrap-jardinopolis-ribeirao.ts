import { NextApiRequest, NextApiResponse } from "next";
import  prisma from "@/lib/prisma"; // ajuste se necessário
import axios from "axios";
import { load } from "cheerio";
import { extrairHorariosDoTexto } from "@/scrape/extrairHorariosDoTexto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = "https://www.ribetransporte.com.br/linha-01/";
    const origem = "Jardinópolis";
    const destino = "Ribeirão Preto";
    const itinerario = `${origem} → ${destino}`;
    const tarifa = "R$ 5,00";
    const diasSemana = ["Segunda à Sexta", "Sábado", "Domingo e Feriados"];

    const response = await axios.get(url);
    const $ = load(response.data);
    const texto = $("body").text();

    const novosHorarios = extrairHorariosDoTexto(texto, itinerario, tarifa, diasSemana);

    const horariosDb = await prisma.horario.findMany({
      where: { origem, destino },
      select: { horario: true, diaDaSemana: true },
    });

    const setToString = (h: { horario: string; diaDaSemana: string }) =>
      `${h.diaDaSemana}-${h.horario}`;

    const existentes = new Set(horariosDb.map(setToString));
    const novos = new Set(novosHorarios.map(setToString));

    const mesmoTamanho = existentes.size === novos.size;
    const mesmosValores = [...novos].every(h => existentes.has(h));

    const status = mesmoTamanho && mesmosValores ? "updated" : "outdated";

    res.status(200).json({ status });
  } catch (error) {
    console.error("Erro na verificação:", error);
    res.status(500).json({ message: "Erro na verificação dos dados." });
  }
}
