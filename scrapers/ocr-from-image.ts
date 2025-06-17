// scrapers/ocr-from-image.ts
import Tesseract from "tesseract.js";
import axios from "axios";
import type { ScrapedHorario } from "../types/scrapers";

function limparHorarios(texto: string): string[] {
  const regex = /\b(\d{1,2})[:hH.\s-](\d{2})\b/g;
  const encontrados = [...texto.matchAll(regex)];
  // O erro estava aqui, mas como mudei a lógica, ele não se aplica mais.
  // A lógica antiga retornava 'undefined' se não encontrasse nada.
  if (!encontrados || encontrados.length === 0) {
    return []; // CORREÇÃO: Sempre retornar um array.
  }

  return encontrados.map(match => {
    const hora = match[1].padStart(2, "0");
    const minuto = match[2].padStart(2, "0");
    return `${hora}:${minuto}`;
  });
}

export async function scrapeOcrFromImage(
  imagemURL: string,
  origemPadrao: string,
  destinoPadrao: string,
): Promise<ScrapedHorario[]> {
  let imageBuffer: Buffer;

  try {
    const response = await axios.get(imagemURL, {
      responseType: 'arraybuffer'
    });
    const contentType = response.headers['content-type'];
    if (!contentType || !contentType.startsWith('image/')) {
      console.error(`[OCR] ERRO: A URL ${imagemURL} não retornou uma imagem. Retornou Content-Type: ${contentType}.`);
      return [];
    }
    imageBuffer = Buffer.from(response.data);
    console.log(`[OCR] Imagem baixada com sucesso (${(imageBuffer.length / 1024).toFixed(2)} KB).`);
  } catch (error) {
    console.error(`[OCR] ERRO: Falha ao baixar a imagem de ${imagemURL}.`);
    return [];
  }

  try {
    // CORREÇÃO: Passar o imageBuffer que baixamos, não a URL.
    const { data: { text } } = await Tesseract.recognize(imageBuffer, "por", {
      logger: m => { if (m.status === 'recognizing text') console.log(`[OCR] Progresso: ${(m.progress * 100).toFixed(2)}%`) }
    });
    console.log("[OCR] Texto extraído processado.");

    const linhas = text.split('\n').filter(line => line.trim() !== '');
    const todosHorarios: ScrapedHorario[] = [];
    let diaDaSemanaAtual = "Segunda à Sexta";
    let sentidoAtual = "ida";

    for (const linha of linhas) {
      const linhaLower = linha.toLowerCase();

      if (linhaLower.includes('segunda') || linhaLower.includes('dias úteis')) {
        diaDaSemanaAtual = 'Segunda à Sexta';
        continue;
      }
      if (linhaLower.includes('sábado')) {
        diaDaSemanaAtual = 'Sábado';
        continue;
      }
      if (linhaLower.includes('domingo') || linhaLower.includes('feriado')) {
        diaDaSemanaAtual = 'Domingo e Feriados';
        continue;
      }
      if (linhaLower.includes(origemPadrao.toLowerCase())) {
        sentidoAtual = 'ida';
        continue;
      }
      if (linhaLower.includes(destinoPadrao.toLowerCase())) {
        sentidoAtual = 'volta';
        continue;
      }

      const horariosNaLinha = limparHorarios(linha);
      if (horariosNaLinha.length > 0) {
        for (const horario of horariosNaLinha) {
          todosHorarios.push({
            origem: sentidoAtual === 'ida' ? origemPadrao : destinoPadrao,
            destino: sentidoAtual === 'ida' ? destinoPadrao : origemPadrao,
            diaDaSemana: diaDaSemanaAtual,
            horario: horario,
            observacao: "Extraído via OCR",
            tarifa: null,
          });
        }
      }
    }

    if (todosHorarios.length === 0) {
      console.warn("⚠️ [OCR] Nenhum horário válido foi extraído da imagem.");
    } else {
      console.log(`[OCR] Processamento finalizado. ${todosHorarios.length} horários encontrados e categorizados.`);
    }

    return todosHorarios;
  } catch (error) {
    console.error(`[OCR] ERRO ao processar a imagem com Tesseract:`, error);
    return [];
  }
}