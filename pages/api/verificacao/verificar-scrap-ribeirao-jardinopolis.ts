// pages/api/verificar-ribeirao-jardinopolis.ts
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import axios from "axios";
import { load } from "cheerio";
import { extrairHorariosDoTexto } from "@/scrape/extrairHorariosDoTexto";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = "https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/";
    const origem = "Ribeirão Preto";
    const destino = "Jardinópolis";
    const itinerario = `${origem} → ${destino}`;
    const tarifa = "R$ 5,00";
    const diasSemana = ["Segunda à Sexta", "Sábado", "Domingo e Feriados"];

    const response = await axios.get(url);
    const $ = load(response.data);
    const texto = $("body").text();
    const horariosRaspados = extrairHorariosDoTexto(texto, itinerario, tarifa, diasSemana);

    const dadosBanco = await prisma.horario.findMany({
      where: { origem, destino },
      select: { horario: true, diaDaSemana: true },
    });

    const format = (h: { horario: string; diaDaSemana: string }) =>
      `${h.diaDaSemana}-${h.horario}`;

    const setBanco = new Set(dadosBanco.map(format));
    const setRaspado = new Set(horariosRaspados.map(format));

    const extrasNoBanco = [...setBanco].filter(item => !setRaspado.has(item));
    const extrasNaRaspagem = [...setRaspado].filter(item => !setBanco.has(item));

    const status = (extrasNoBanco.length === 0 && extrasNaRaspagem.length === 0)
      ? "updated"
      : "outdated";

    res.status(200).json({
      status,
      resumo: {
        totalBanco: setBanco.size,
        totalRaspado: setRaspado.size,
        diferentesNoBanco: extrasNoBanco.length,
        diferentesNaRaspagem: extrasNaRaspagem.length,
      },
      diffs: {
        extrasNoBanco,
        extrasNaRaspagem,
      }
    });

  } catch (error) {
    console.error("Erro na verificação de Ribeirão → Jardinópolis:", error);
    res.status(500).json({
      status: "error",
      message: "Erro ao verificar os dados.",
      detalhes: error instanceof Error ? error.message : error
    });
  }
}
