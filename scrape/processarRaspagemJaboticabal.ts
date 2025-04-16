import axios from "axios";
import * as cheerio from "cheerio";
import prisma from "../lib/prisma";

export default async function processarRaspagemJaboticabal(url: string, origem: string) {
  const { data: html } = await axios.get(url);
  const $ = cheerio.load(html);

  const horarios: {
    origem: string;
    destino: string;
    horario: string;
    diaDaSemana: string;
    observacao: string | null;
  }[] = [];

  let destinoAtual: string | null = null;
  let observacaoAtual: string | null = null;
  let diaDaSemanaAtual = "Segunda à Sexta"; // valor padrão

  const formatarHorario = (texto: string): string => {
    const match = texto.match(/(\d{1,2})h(\d{2})?/i);
    if (match) {
      const hora = match[1].padStart(2, '0');
      const minuto = match[2] ? match[2].padStart(2, '0') : '00';
      return `${hora}:${minuto}`;
    }
    return texto;
  };

  const ehDiaDaSemana = (texto: string): boolean => {
    return /domingo|sábado|segunda|sexta/i.test(texto);
  };

  $('.pgd_descricao_pagina_dinamica').children().each((_, element) => {
    const tag = $(element).prop("tagName")?.toLowerCase();
    const texto = $(element).text().trim();

    // <p><strong>...</strong></p>
    if (tag === "p" && $(element).find("strong").length > 0) {
      if (ehDiaDaSemana(texto)) {
        diaDaSemanaAtual = texto;
      } else {
        destinoAtual = texto;
        observacaoAtual = null; // resetar observações
        diaDaSemanaAtual = "Segunda à Sexta"; // resetar quando muda de destino
      }
    }

    // <p> com observações (sem strong)
    else if (tag === "p" && $(element).find("strong").length === 0) {
      if (/^convencional/i.test(texto)) {
        observacaoAtual = "Convencional";
      } else if (/^suburbano/i.test(texto)) {
        observacaoAtual = "Suburbano";
      }
    }

    // <ul> com horários
    if (tag === "ul" && destinoAtual) {
      $(element).find("li").each((_, li) => {
        const horarioBruto = $(li).text().trim().replace("*", "");
        if (horarioBruto) {
          const horarioFormatado = formatarHorario(horarioBruto);
          horarios.push({
            origem,
            destino: destinoAtual,
            horario: horarioFormatado,
            diaDaSemana: diaDaSemanaAtual,
            observacao: observacaoAtual,
          });
        }
      });
    }
  });

  for (const item of horarios) {
    const existe = await prisma.horario.findFirst({
      where: {
        origem: item.origem,
        destino: item.destino,
        horario: item.horario,
        diaDaSemana: item.diaDaSemana,
      },
    });

    if (!existe) {
      await prisma.horario.create({
        data: {
          origem: item.origem,
          destino: item.destino,
          horario: item.horario,
          diaDaSemana: item.diaDaSemana,
          observacao: item.observacao,
        },
      });
    }
  }

  console.log(`Raspagem finalizada. ${horarios.length} horários processados.`);
}
