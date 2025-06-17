import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedHorario } from "../types/scrapers";

// Função auxiliar para formatar horários como "14h30" para "14:30"
const formatarHorario = (texto: string): string => {
  const match = texto.match(/(\d{1,2})h(\d{2})?/i);
  if (match) {
    const hora = match[1].padStart(2, '0');
    const minuto = match[2] ? match[2].padStart(2, '0') : '00';
    return `${hora}:${minuto}`;
  }
  return texto.replace(/[hH]/, ":").padStart(5, "0"); // Fallback para formatos como "14:30"
};

const ehDiaDaSemana = (texto: string): boolean => {
  return /domingo|sábado|segunda|sexta/i.test(texto);
};

/**
 * Raspa horários de um site estático usando Cheerio.
 * @param url A URL da página de horários.
 * @param origem A cidade de origem para estes horários.
 * @returns Uma promessa que resolve para um array de horários raspados.
 */
export async function scrapeCheerioJaboticabal(url: string, origem: string): Promise<ScrapedHorario[]> {
  console.log(`[Cheerio] Iniciando raspagem para ${origem} em ${url}`);
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const horarios: ScrapedHorario[] = [];

  let destinoAtual: string | null = null;
  let observacaoAtual: string | null = null;
  let diaDaSemanaAtual = "Segunda à Sexta"; // Valor padrão

  $('.pgd_descricao_pagina_dinamica').children().each((_, element) => {
    const tag = $(element).prop("tagName")?.toLowerCase();
    const texto = $(element).text().trim();

    if (!texto) return;

    if (tag === "p" && $(element).find("strong").length > 0) {
      if (ehDiaDaSemana(texto)) {
        diaDaSemanaAtual = texto.replace(":", "").trim();
      } else {
        destinoAtual = texto.replace(":", "").trim();
        observacaoAtual = null;
        diaDaSemanaAtual = "Segunda à Sexta";
      }
    } else if (tag === "p" && $(element).find("strong").length === 0) {
      if (/^convencional/i.test(texto)) observacaoAtual = "Convencional";
      else if (/^suburbano/i.test(texto)) observacaoAtual = "Suburbano";
    }

    if (tag === "ul" && destinoAtual) {
      $(element).find("li").each((_, li) => {
        const horarioBruto = $(li).text().trim().replace("*", "");
        if (horarioBruto) {
          horarios.push({
            origem,
            destino: destinoAtual!,
            horario: formatarHorario(horarioBruto),
            diaDaSemana: diaDaSemanaAtual,
            observacao: observacaoAtual,
            tarifa: null, // Scraper não captura tarifa, então definimos como null
          });
        }
      });
    }
  });

  console.log(`[Cheerio] Raspagem finalizada. ${horarios.length} horários encontrados.`);
  return horarios;
}