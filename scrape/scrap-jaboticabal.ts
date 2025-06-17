//scrape/scrap-jaboticabal.ts
import axios from "axios";
import * as cheerio from "cheerio";

export async function extrairHorariosJaboticabal(url: string, origem: string) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const horarios: {
    origem: string;
    destino: string;
    horario: string;
    diaDaSemana: string;
    observacao: string | null;
  }[] = [];

  $('h3').each((_, element) => {
    const destino = $(element).text().trim();

    if (destino && destino !== "Expresso Itamarati Ltda.") {
      $(element).nextAll('p').each((_, pElement) => {
        const texto = $(pElement).text().trim();

        if (texto.includes("Convencionais")) {
          $(pElement).next("ul").find("li").each((_, liElement) => {
            const horario = $(liElement).text().trim();
            horarios.push({
              origem,
              destino,
              horario: `${horario}:00`,
              diaDaSemana: "Segunda à Sexta",
              observacao: "Convencional",
            });
          });
        }

        if (texto.includes("Suburbanos")) {
          $(pElement).next("ul").find("li").each((_, liElement) => {
            const horario = $(liElement).text().trim();
            horarios.push({
              origem,
              destino,
              horario: `${horario}:00`,
              diaDaSemana: "Segunda à Sexta",
              observacao: "Suburbano",
            });
          });
        }
      });
    }
  });

  return horarios;
}
