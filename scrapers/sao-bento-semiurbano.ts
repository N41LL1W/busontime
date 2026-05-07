import axios from 'axios';
import * as cheerio from 'cheerio';
import { scrapeOcrFromImage } from './ocr-from-image';
import type { ScrapedHorario } from '../types/scrapers';

type SaoBentoRoute = {
  origem: string;
  destino: string;
  imageUrl: string;
  keywords: string[];
};

const VSB_SERVICOS_URL = 'https://www.vsb.com.br/servicos';

const fallbackRoutes: SaoBentoRoute[] = [
  {
    origem: 'Barrinha',
    destino: 'Sertãozinho',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg',
    keywords: ['barrinha', 'sertãozinho', 'sertaozinho'],
  },
  {
    origem: 'Batatais',
    destino: 'Altinópolis',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg',
    keywords: ['batatais', 'altinópolis', 'altinopolis'],
  },
  {
    origem: 'Brodowski',
    destino: 'Batatais',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2022/05/16-05-2022-Batatais-x-Brodowski_page-0001.jpg',
    keywords: ['brodowski', 'batatais'],
  },
  {
    origem: 'São Benedito da Cachoeirinha',
    destino: 'Ituverava',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Sao-Benedito-da-Cachoeirinha_page-0001.jpg',
    keywords: ['são benedito', 'sao benedito', 'cachoeirinha', 'ituverava'],
  },
  {
    origem: 'Miguelópolis',
    destino: 'Barretos',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/01/Barretos-Miguelopolis_page-0001-1.jpg',
    keywords: ['miguelópolis', 'miguelopolis', 'barretos'],
  },
  {
    origem: 'Miguelópolis',
    destino: 'Ituverava',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2021/12/08-12-2021-Ituverava-X-Miguelopolis_page-0001.jpg',
    keywords: ['miguelópolis', 'miguelopolis', 'ituverava'],
  },
  {
    origem: 'Ribeirão Preto',
    destino: 'Altinópolis',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Altinopolis.jpg',
    keywords: ['ribeirão preto', 'ribeirao preto', 'altinópolis', 'altinopolis'],
  },
  {
    origem: 'Ribeirão Preto',
    destino: 'Barrinha',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2025/02/18-02-2025-Ribeirao-Preto-x-Barrinha_page-0001-2.jpg',
    keywords: ['ribeirão preto', 'ribeirao preto', 'barrinha'],
  },
  {
    origem: 'Ribeirão Preto',
    destino: 'Batatais',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Ribeirao-Preto-x-Batatais.jpg',
    keywords: ['ribeirão preto', 'ribeirao preto', 'batatais'],
  },
  {
    origem: 'Ribeirão Preto',
    destino: 'Brodowski',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/12/Ribeirao-Preto-x-Brodowski_page-0001-scaled.jpg',
    keywords: ['ribeirão preto', 'ribeirao preto', 'brodowski'],
  },
  {
    origem: 'Ribeirão Preto',
    destino: 'Serra Azul',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/02/Untitled1_page-00011.jpg',
    keywords: ['ribeirão preto', 'ribeirao preto', 'serra azul'],
  },
  {
    origem: 'Ribeirão Preto',
    destino: 'Serrana',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2024/12/25-12-24-Ribeirao-Preto-x-Serrana-Atual.jpg',
    keywords: ['ribeirão preto', 'ribeirao preto', 'serrana'],
  },
  {
    origem: 'Ribeirão Preto',
    destino: 'Sertãozinho',
    imageUrl: 'https://suburbano.vsb.com.br/wp-content/uploads/2025/01/Ribeirao-Preto-x-Sertaozinho-10-01-2025_page-0001-2.jpg',
    keywords: ['ribeirão preto', 'ribeirao preto', 'sertãozinho', 'sertaozinho'],
  },
];

function normalizeUrl(url: string) {
  return url.startsWith('http') ? url : new URL(url, VSB_SERVICOS_URL).toString();
}

function routeWithDiscoveredImage(route: SaoBentoRoute, discoveredImages: string[]) {
  const image = discoveredImages.find((url) => {
    const normalized = decodeURIComponent(url).toLowerCase().replace(/-/g, ' ');
    return route.keywords.every((keyword) => normalized.includes(keyword));
  });

  return image ? { ...route, imageUrl: image } : route;
}

async function discoverSemiurbanoImages() {
  const { data: html } = await axios.get(VSB_SERVICOS_URL, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; BusOnTimeBot/1.0)',
    },
  });
  const $ = cheerio.load(html);
  const images = new Set<string>();

  $('img').each((_, element) => {
    const src = $(element).attr('src') || $(element).attr('data-src') || '';
    const alt = $(element).attr('alt') || '';
    const content = `${src} ${alt}`.toLowerCase();

    if (src && (/suburbano|ribeirao|ribeirão|brodowski|serrana|barrinha|batatais|altinopolis|altinópolis|ituverava|sertãozinho|sertaozinho/.test(content))) {
      images.add(normalizeUrl(src));
    }
  });

  return Array.from(images);
}

export async function scrapeSaoBentoSemiurbano(): Promise<ScrapedHorario[]> {
  let discoveredImages: string[] = [];

  try {
    discoveredImages = await discoverSemiurbanoImages();
  } catch (error) {
    console.warn('[São Bento] Não foi possível descobrir imagens atualizadas no site da São Bento. Usando URLs conhecidas.', error instanceof Error ? error.message : error);
  }

  const routes = fallbackRoutes.map((route) => routeWithDiscoveredImage(route, discoveredImages));
  const results: ScrapedHorario[] = [];

  for (const route of routes) {
    const routeResults = await scrapeOcrFromImage(route.imageUrl, route.origem, route.destino);
    results.push(...routeResults);
  }

  return results;
}
