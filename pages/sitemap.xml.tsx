import { GetServerSideProps } from "next";
import prisma from "../lib/prisma";

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function gerarSitemap(urls: string[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://busontime.vercel.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://busontime.vercel.app/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://busontime.vercel.app/suggest</loc>
    <changefreq>monthly</changefreq>
    <priority>0.4</priority>
  </url>
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const rotas = await prisma.rota.findMany({
      where: { ativo: true },
      select: { origem: true, destino: true },
    });

    const slugsVistos = new Set<string>();
    const urls: string[] = [];

    for (const rota of rotas) {
      const slug = `${slugify(rota.origem)}-ate-${slugify(rota.destino)}`;
      if (!slugsVistos.has(slug)) {
        slugsVistos.add(slug);
        urls.push(`https://busontime.vercel.app/rota/${slug}`);
      }
    }

    const sitemap = gerarSitemap(urls);

    res.setHeader("Content-Type", "text/xml");
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate");
    res.write(sitemap);
    res.end();
  } catch {
    res.setHeader("Content-Type", "text/xml");
    res.write(gerarSitemap([]));
    res.end();
  }

  return { props: {} };
};

export default function Sitemap() {
  return null;
}