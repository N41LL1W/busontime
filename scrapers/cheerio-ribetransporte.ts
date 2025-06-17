// scrapers/cheerio-ribetransporte.ts
import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedHorario } from "../types/scrapers";

/**
 * Raspa horários do site ribetransporte.com.br usando Cheerio.
 * Este scraper é projetado para lidar com as tabelas de horários do site.
 * @param url A URL da página de horários específica (ex: /ribeirao-preto-a-jardinopolis/).
 * @param origem A cidade de origem para esta rota.
 * @param destino A cidade de destino para esta rota.
 * @returns Uma promessa que resolve para um array de horários raspados.
 */
export async function scrapeRibeTransporte(url: string, origem: string, destino: string): Promise<ScrapedHorario[]> {
  console.log(`[Cheerio-RibeTransporte] Iniciando raspagem para ${origem} -> ${destino} em ${url}`);

  try {
    const { data: html } = await axios.get(url);
    const $ = cheerio.load(html);
    const todosHorarios: ScrapedHorario[] = [];

    // O seletor chave: a div que contém todo o conteúdo da página.
    const contentContainer = $('.elementor-widget-container');

    // Encontra todos os títulos h3, que separam os dias da semana.
    contentContainer.find('h3').each((_, h3Element) => {
      const diaDaSemanaTexto = $(h3Element).text().trim();
      let diaDaSemana = "Segunda à Sexta"; // Default

      if (diaDaSemanaTexto.toLowerCase().includes('sábado')) {
        diaDaSemana = "Sábado";
      } else if (diaDaSemanaTexto.toLowerCase().includes('domingo') || diaDaSemanaTexto.toLowerCase().includes('feriado')) {
        diaDaSemana = "Domingo e Feriados";
      }

      // A tabela de horários é o próximo elemento irmão da tag <h3>
      const table = $(h3Element).next('div.elementor-widget-container').find('table');
      
      // Itera sobre cada linha <tr> da tabela, pulando o cabeçalho
      table.find('tr').slice(1).each((_, trElement) => {
        const cells = $(trElement).find('td');
        if (cells.length > 0) {
          const horario = $(cells[0]).text().trim();
          
          // Validação para garantir que é um horário válido
          if (/^\d{1,2}:\d{2}$/.test(horario)) {
            todosHorarios.push({
              origem: origem,
              destino: destino,
              diaDaSemana: diaDaSemana,
              horario: horario.padStart(5, '0'), // Garante o formato HH:mm
              observacao: cells.length > 1 ? $(cells[1]).text().trim() : null,
              tarifa: null
            });
          }
        }
      });
    });

    if (todosHorarios.length === 0) {
      console.warn(`[Cheerio-RibeTransporte] ⚠️ Nenhum horário encontrado para ${url}. Verifique se o layout do site mudou.`);
    } else {
      console.log(`[Cheerio-RibeTransporte] Raspagem finalizada. ${todosHorarios.length} horários encontrados.`);
    }

    return todosHorarios;

  } catch (error) {
    console.error(`[Cheerio-RibeTransporte] ❌ Erro ao raspar ${url}:`, error.message);
    return []; // Retorna array vazio em caso de erro
  }
}