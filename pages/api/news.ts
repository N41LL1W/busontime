// pages/api/news.ts
import type { NextApiRequest, NextApiResponse } from "next";

export type NewsItem = {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsItem[]>
) {
  try {
    const query = encodeURIComponent(
      ' "transporte" OR "ônibus" OR "linhas" OR "tarifa" ("Ribeirão Preto" OR "Brodowski" OR "Jardinópolis" OR "Sertãozinho" OR "Cravinhos" OR "Serrana")'
    );
    const rssUrl = `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt-419`;

    const response = await fetch(rssUrl);
    const xmlText = await response.text();

    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s+S\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const titleMatch = /<title>(.*?)<\/title>/.exec(itemContent);
      const linkMatch = /<link>(.*?)<\/link>/.exec(itemContent);
      const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/.exec(itemContent);
      const sourceMatch = /<source[^>]*>(.*?)<\/source>/.exec(itemContent);

      let rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") : "";
      const link = linkMatch ? linkMatch[1] : "#";
      const pubDate = pubDateMatch ? new Date(pubDateMatch[1]).toLocaleDateString("pt-BR") : "";
      const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1") : "Google News";

      // Limpa título e extrai fonte padrão se presente no final (Ex: "Título - NomeDoSite")
      if (rawTitle.includes(" - ")) {
        const parts = rawTitle.split(" - ");
        rawTitle = parts.slice(0, -1).join(" - ");
      }

      items.push({
        title: rawTitle,
        link,
        pubDate,
        source,
        snippet: `Informaçoes e atualizações sobre o transporte público e intermunicipal na região.`,
      });

      if (items.length >= 8) break; // Limita a 8 notícias
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=1800");
    return res.status(200).json(items);
  } catch (error) {
    console.error("Erro ao carregar notícias:", error);
    return res.status(200).json([]);
  }
}