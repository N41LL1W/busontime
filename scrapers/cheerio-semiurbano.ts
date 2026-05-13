import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedHorario } from "../types/scrapers";
import { scrapeSemiurbanoSupabaseRoute } from "./supabase-semiurbano";
import { scrapeSemiurbanoPuppeteerRoute } from "./puppeteer-semiurbano";

const SEMIURBANO_APP_URL = "https://semiurbano.lovable.app/horarios";

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

type RouteOptions = {
  url?: string;
  origem: string;
  destino: string;
  label?: string;
  enableBrowserFallback?: boolean;
};

const normalizarTexto = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/brodowsky/g, "brodowski")
    .replace(/cachoerinha/g, "cachoeirinha")
    .trim();

const limparTexto = (texto: string) =>
  texto
    .replace(/\\n/g, "\n")
    .replace(/\\u00e0/g, "à")
    .replace(/\\u00e1/g, "á")
    .replace(/\\u00e2/g, "â")
    .replace(/\\u00e3/g, "ã")
    .replace(/\\u00e7/g, "ç")
    .replace(/\\u00e9/g, "é")
    .replace(/\\u00ea/g, "ê")
    .replace(/\\u00ed/g, "í")
    .replace(/\\u00f3/g, "ó")
    .replace(/\\u00f4/g, "ô")
    .replace(/\\u00f5/g, "õ")
    .replace(/\\u00fa/g, "ú")
    .replace(/\\u00c0/g, "À")
    .replace(/\\u00c1/g, "Á")
    .replace(/\\u00c2/g, "Â")
    .replace(/\\u00c3/g, "Ã")
    .replace(/\\u00c7/g, "Ç")
    .replace(/\\u00c9/g, "É")
    .replace(/\\u00ca/g, "Ê")
    .replace(/\\u00cd/g, "Í")
    .replace(/\\u00d3/g, "Ó")
    .replace(/\\u00d4/g, "Ô")
    .replace(/\\u00d5/g, "Õ")
    .replace(/\\u00da/g, "Ú")
    .replace(/&nbsp;/g, " ")
    .replace(/\r/g, "");

const formatarHorario = (hora: string, minuto: string) =>
  `${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}`;

const extrairHorarios = (texto: string) => {
  const horarios = new Set<string>();
  const regex = /\b(\d{1,2})\s*(?::|h|H|\.)\s*(\d{2})\b/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto)) !== null) {
    const hora = Number(match[1]);
    const minuto = Number(match[2]);
    if (hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59) {
      horarios.add(formatarHorario(match[1], match[2]));
    }
  }

  return Array.from(horarios);
};

function identificarDia(texto: string) {
  const textoNormalizado = normalizarTexto(texto);

  if (textoNormalizado.includes("sabado")) return "Sábado";
  if (textoNormalizado.includes("domingo") || textoNormalizado.includes("feriado")) {
    return "Domingo e Feriados";
  }
  if (
    textoNormalizado.includes("segunda") ||
    textoNormalizado.includes("sexta") ||
    textoNormalizado.includes("dias uteis") ||
    textoNormalizado.includes("uteis")
  ) {
    return "Segunda à Sexta";
  }

  return null;
}

async function carregarDocumentoComBundles(url: string) {
  const { data: html } = await axios.get<string>(url, {
    headers: REQUEST_HEADERS,
    timeout: 30_000,
  });

  const $ = cheerio.load(html);
  const baseUrl = new URL(url);
  const textos = [$("body").text(), html];
  const scripts = new Set<string>();

  $("script[src]").each((_, script) => {
    const src = $(script).attr("src");
    if (src) scripts.add(new URL(src, baseUrl).toString());
  });

  for (const scriptUrl of scripts) {
    try {
      const { data } = await axios.get<string>(scriptUrl, {
        headers: { ...REQUEST_HEADERS, Accept: "application/javascript,*/*;q=0.8" },
        timeout: 30_000,
      });
      textos.push(data);
    } catch (error) {
      console.warn(`[Semiurbano] Não foi possível baixar bundle ${scriptUrl}:`, error);
    }
  }

  return limparTexto(textos.join("\n"));
}

function recortarBlocosDaRota(documento: string, origem: string, destino: string, label?: string) {
  const documentoNormalizado = normalizarTexto(documento);
  const termos = [origem, destino, label].filter(Boolean).map((termo) => normalizarTexto(termo!));
  const indices = new Set<number>();

  for (const termo of termos) {
    let inicioBusca = 0;
    while (inicioBusca < documentoNormalizado.length) {
      const indice = documentoNormalizado.indexOf(termo, inicioBusca);
      if (indice === -1) break;
      indices.add(indice);
      inicioBusca = indice + termo.length;
    }
  }

  if (!indices.size) return [documento];

  return Array.from(indices).map((indice) => {
    const inicio = Math.max(0, indice - 8_000);
    const fim = Math.min(documento.length, indice + 18_000);
    return documento.slice(inicio, fim);
  });
}

function blocoContemRota(bloco: string, origem: string, destino: string, label?: string) {
  const normalizado = normalizarTexto(bloco);
  const origemNormalizada = normalizarTexto(origem);
  const destinoNormalizado = normalizarTexto(destino);
  const labelNormalizada = label ? normalizarTexto(label) : "";

  return (
    (normalizado.includes(origemNormalizada) && normalizado.includes(destinoNormalizado)) ||
    (labelNormalizada.length > 0 && normalizado.includes(labelNormalizada))
  );
}

function extrairDoBloco(bloco: string, origem: string, destino: string, label?: string) {
  if (!blocoContemRota(bloco, origem, destino, label)) return [];

  const horarios: ScrapedHorario[] = [];
  const partes = bloco
    .replace(/[{}[\](),;]/g, "\n")
    .replace(/<[^>]+>/g, "\n")
    .split(/\n|\\n|\|/)
    .map((linha) => linha.replace(/["'`]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let diaDaSemanaAtual = "Segunda à Sexta";
  let sentidoAtual: "ida" | "volta" = "ida";

  for (const parte of partes) {
    const dia = identificarDia(parte);
    if (dia) {
      diaDaSemanaAtual = dia;
      continue;
    }

    const parteNormalizada = normalizarTexto(parte);
    if (parteNormalizada.includes(normalizarTexto(destino)) && parteNormalizada.includes(normalizarTexto(origem))) {
      sentidoAtual = parteNormalizada.indexOf(normalizarTexto(destino)) < parteNormalizada.indexOf(normalizarTexto(origem)) ? "volta" : "ida";
    } else if (parteNormalizada.includes(normalizarTexto(destino))) {
      sentidoAtual = "volta";
    } else if (parteNormalizada.includes(normalizarTexto(origem))) {
      sentidoAtual = "ida";
    }

    for (const horario of extrairHorarios(parte)) {
      horarios.push({
        origem: sentidoAtual === "ida" ? origem : destino,
        destino: sentidoAtual === "ida" ? destino : origem,
        diaDaSemana: diaDaSemanaAtual,
        horario,
        observacao: "Extraído do site Semiurbano São Bento",
        tarifa: null,
      });
    }
  }

  return horarios;
}

function deduplicar(horarios: ScrapedHorario[]) {
  const mapa = new Map<string, ScrapedHorario>();

  for (const item of horarios) {
    const chave = `${item.origem}|${item.destino}|${item.diaDaSemana}|${item.horario}`;
    mapa.set(chave, item);
  }

  return Array.from(mapa.values()).sort((a, b) =>
    `${a.origem}|${a.destino}|${a.diaDaSemana}|${a.horario}`.localeCompare(
      `${b.origem}|${b.destino}|${b.diaDaSemana}|${b.horario}`,
      "pt-BR"
    )
  );
}

export async function scrapeSemiurbanoRoute({
  url = SEMIURBANO_APP_URL,
  origem,
  destino,
  label,
  enableBrowserFallback = process.env.ENABLE_SEMIURBANO_BROWSER_FALLBACK === "false",
}: RouteOptions): Promise<ScrapedHorario[]> {
  console.log(`[Semiurbano] Iniciando coleta para ${origem} -> ${destino} em ${url}`);

  const supabaseHorarios = await scrapeSemiurbanoSupabaseRoute({ origem, destino, label });
  if (supabaseHorarios.length > 0) {
    return supabaseHorarios;
  }

  console.warn(`[Semiurbano] API pública não retornou dados para ${origem} -> ${destino}; usando fallback textual.`);

  try {
    const documento = await carregarDocumentoComBundles(url);
    const blocos = recortarBlocosDaRota(documento, origem, destino, label);
    const horarios = deduplicar(
      blocos.flatMap((bloco) => extrairDoBloco(bloco, origem, destino, label))
    );

    if (!horarios.length) {
      console.warn(`[Semiurbano] Nenhum horário encontrado para ${origem} -> ${destino}.`);
    } else {
      console.log(`[Semiurbano] Raspagem finalizada para ${origem} -> ${destino}: ${horarios.length} horário(s).`);
    }

    if (horarios.length > 0) {
      return horarios;
    }
  } catch (error) {
    console.error(`[Semiurbano] Erro ao raspar ${origem} -> ${destino}:`, error);
  }

  if (!enableBrowserFallback) {
    console.warn(
      `[Semiurbano] Fallback textual não encontrou dados para ${origem} -> ${destino}; navegador automatizado desativado por configuração.`,
    );
    return [];
  }

  console.warn(`[Semiurbano] Fallback textual não encontrou dados para ${origem} -> ${destino}; pesquisando com navegador automatizado.`);
  return scrapeSemiurbanoPuppeteerRoute({ url, origem, destino, label });
}

export { SEMIURBANO_APP_URL };
