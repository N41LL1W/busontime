// pages/index.tsx
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import AdBanner from "@/components/Adbanner";
import { Bus, Newspaper, MapPin, Clock, ArrowRight, ShieldCheck, ExternalLink } from "lucide-react";
import type { NewsItem } from "@/pages/api/news";

export type HorarioFlat = {
  id: number;
  rotaId: number;
  horario: string;
  diaDaSemana: string;
  sentido: string;
  tipo: string;
  observacao: string | null;
  origem: string;
  destino: string;
  linha: string | null;
  tarifaComum: number | null;
  tarifaEstudante: number | null;
  empresaNome: string;
  sourceUrl: string | null;
};

export default function HomePage() {
  const [noticias, setNoticias] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/news")
      .then((res) => res.json())
      .then((data) => {
        setNoticias(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Head>
        <title>BusOnTime — Portal do Transporte Coletivo e Intermunicipal de Ribeirão Preto e Região</title>
        <meta
          name="description"
          content="Notícias, atualizações, tarifas e guias sobre as linhas de ônibus intermunicipais e suburbanas de Ribeirão Preto, Brodowski, Jardinópolis, Cravinhos, Serrana e Sertãozinho."
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-24">
        
        {/* Banner de Anúncio - Topo Editorial */}
        <div className="w-full flex justify-center border-b pb-4">
          <AdBanner slot="9088960446" />
        </div>

        {/* Hero Section */}
        <section className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
              <Bus className="w-3.5 h-3.5" /> Portal Informativo Regional
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
              Mobilidade e Transporte Suburbano na Região de Ribeirão Preto
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Acompanhe as últimas notícias, reajustes tarifários, alterações de itinerários e informações oficiais sobre o transporte intermunicipal que conecta Ribeirão Preto às cidades vizinhas.
            </p>
          </div>
          <Link
            href="/horarios"
            className="shrink-0 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl shadow hover:bg-primary/90 transition-all text-sm w-full md:w-auto"
          >
            <Clock className="w-4 h-4" /> Consultar Horários <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

        {/* Bloco de Notícias da Região */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-primary" /> Notícias e Atualizações Recentes
            </h2>
            <span className="text-xs text-muted-foreground">Atualizado via Feed</span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-32 bg-muted/40 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : noticias.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {noticias.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-card border rounded-xl p-4 hover:border-primary/50 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-2">
                      <span className="font-semibold text-primary">{item.source}</span>
                      <span>{item.pubDate}</span>
                    </div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary font-medium mt-3">
                    Ler matéria original <ExternalLink className="w-3 h-3" />
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma notícia recente encontrada no momento.
            </p>
          )}
        </section>

        {/* Banner de Anúncio - Meio do Conteúdo */}
        <div className="w-full flex justify-center py-2 border-y">
          <AdBanner slot="5149715430" />
        </div>

        {/* Artigo Editorial Rico em Texto (Cumpre exigência do AdSense) */}
        <article className="bg-card border rounded-2xl p-6 md:p-8 space-y-6 text-sm text-muted-foreground leading-relaxed shadow-sm">
          <h2 className="text-xl font-bold text-foreground border-b pb-3">
            Guia Completo do Transporte Intermunicipal e Suburbano
          </h2>

          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">A Conectividade em Ribeirão Preto</h3>
            <p>
              Ribeirão Preto atua como o principal polo econômico, educacional e de saúde do nordeste paulista. Diariamente, milhares de trabalhadores e estudantes deslocam-se de municípios como <strong>Brodowski, Jardinópolis, Cravinhos, Serrana, Sertãozinho e Batatais</strong> em direção à metrópole regional.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">Principais Operadoras e Regulação</h3>
            <p>
              O sistema de transporte suburbano na região é regulado pela <strong>ARTESP</strong> (Agência de Transporte do Estado de São Paulo) e operado por concessionárias tradicionais:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Viação São Bento:</strong> Conecta Ribeirão Preto a Brodowski, Batatais, Franca e linhas intermediárias.</li>
              <li><strong>Ribe Transporte:</strong> Responsável pelo atendimento da linha entre Ribeirão Preto e Jardinópolis.</li>
              <li><strong>Rápido d'Oeste:</strong> Atende rotas como Cravinhos, Serrana e Santa Rosa de Viterbo.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-foreground text-base">Direitos e Informações de Embarque</h3>
            <p>
              Os veículos suburbanos contam com pontos de embarque tanto nas rodoviárias municipais quanto em pontos intermediários ao longo das principais avenidas de ligação urbana. Estudantes e idosos possuem garantias de gratuidade ou desconto tarifário mediante cadastramento prévio junto às operadoras.
            </p>
          </section>
        </article>

        {/* Links rápidos para rotas */}
        <section className="bg-muted/40 rounded-2xl p-6 text-center space-y-3">
          <h3 className="font-bold text-foreground">Precisa consultar um horário específico?</h3>
          <p className="text-xs text-muted-foreground">
            Acesse nossa ferramenta de busca rápida e veja a tabela completa de saídas diárias.
          </p>
          <Link
            href="/horarios"
            className="inline-flex items-center gap-2 bg-foreground text-background font-medium px-4 py-2 rounded-lg text-xs hover:opacity-90 transition-opacity"
          >
            Abrir buscador de horários →
          </Link>
        </section>

      </div>
    </>
  );
}