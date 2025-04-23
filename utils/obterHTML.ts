import axios from "axios";
import { load } from "cheerio";

/**
 * Faz uma requisição HTTP e retorna o HTML da página como string.
 * @param url URL da página a ser buscada
 */
export async function obterHTML(url: string): Promise<string> {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error: any) {
    console.error(`Erro ao obter HTML de ${url}:`, error.message);
    throw new Error("Erro ao obter o conteúdo da página");
  }
}

/**
 * Faz uma requisição HTTP e retorna apenas o texto limpo da página (sem tags HTML).
 * @param url URL da página a ser buscada
 */
export async function obterTextoLimpo(url: string): Promise<string> {
  const html = await obterHTML(url);
  const $ = load(html);

  // Remove elementos irrelevantes
  $("script, style, noscript, header, footer").remove();

  // Extrai texto limpo
  const textoLimpo = $("body").text().replace(/\s+/g, " ").trim();
  return textoLimpo;
}
