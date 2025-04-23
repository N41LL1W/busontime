import { NextApiRequest, NextApiResponse } from "next";
import { extrairHorariosDoTexto } from "@/scrape/extrairHorariosDoTexto";
import prisma from "@/lib/prisma";
import { obterTextoLimpo } from "@/utils/obterHTML";
import { rotasInfo } from "@/utils/rotaInfo";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const resultados = [];

    for (const rota of rotasInfo) {
      const texto = await obterTextoLimpo(rota.url); // ✅ Uso correto com await
      const horariosExtraidos = extrairHorariosDoTexto(
        texto,
        rota.origem,
        rota.diaDaSemana,
        [rota.tarifa]
      );

      const horariosDB = await prisma.horario.findMany({
        where: {
          origem: rota.origem,
          diaDaSemana: rota.diaDaSemana,
        },
        select: {
          horario: true,
        },
      });

      const horariosDBFormatados = horariosDB.map((h) => h.horario).sort();
      const horariosExtraidosFormatados = horariosExtraidos.map((h) => h.horario).sort();

      const iguais =
        JSON.stringify(horariosDBFormatados) === JSON.stringify(horariosExtraidosFormatados);

      resultados.push({
        rota: rota.endpoint,
        status: iguais ? "updated" : "outdated",
      });
    }

    res.status(200).json({ status: "ok", resultados });
  } catch (error) {
    console.error("Erro na verificação das rotas:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
}
