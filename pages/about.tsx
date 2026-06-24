import Head from "next/head";
import Link from "next/link";
import { Bus, Database, RefreshCw, MapPin, ExternalLink } from "lucide-react";

const empresas = [
  {
    nome: "Viação São Bento",
    url: "https://semiurbano.lovable.app/horarios",
    descricao: "Linhas semiurbanas da região de Ribeirão Preto, Brodowski, Batatais e mais.",
    cor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  },
  {
    nome: "Ribe Transporte",
    url: "https://www.ribetransporte.com.br",
    descricao: "Linha Ribeirão Preto ↔ Jardinópolis.",
    cor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  },
  {
    nome: "Rápido d'Oeste",
    url: "https://suburbano.rapidodoeste.com.br",
    descricao: "17 linhas suburbanas: Pontal, Cravinhos, Jaboticabal, São Simão, Taquaritinga e mais.",
    cor: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200",
  },
];

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>Sobre — BusOnTime</title>
        <meta
          name="description"
          content="Sobre o BusOnTime: horários de ônibus suburbanos do interior de SP."
        />
      </Head>

      <div className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">

          {/* Header */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Bus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">BusOnTime</h1>
                <p className="text-sm text-muted-foreground">Horários de ônibus suburbanos</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              O BusOnTime reúne os horários de ônibus suburbanos do interior de São Paulo em um só lugar.
              Consulte horários, compare tarifas entre empresas e encontre o próximo ônibus da sua rota.
            </p>
          </div>

          {/* Empresas */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Empresas disponíveis
            </h2>
            <div className="space-y-3">
              {empresas.map((e) => (
                <div key={e.nome} className="rounded-xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.cor}`}>
                      {e.nome}
                    </span>
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Site oficial <ExternalLink size={10} />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground">{e.descricao}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Como funciona */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Como funciona
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <span className="shrink-0 rounded-full bg-primary/10 text-primary w-6 h-6 flex items-center justify-center text-xs font-bold">1</span>
                <p>Os horários são coletados automaticamente dos sites oficiais das empresas toda semana.</p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 rounded-full bg-primary/10 text-primary w-6 h-6 flex items-center justify-center text-xs font-bold">2</span>
                <p>Os dados são armazenados em banco de dados e servidos rapidamente para você.</p>
              </div>
              <div className="flex gap-3">
                <span className="shrink-0 rounded-full bg-primary/10 text-primary w-6 h-6 flex items-center justify-center text-xs font-bold">3</span>
                <p>Quando há mudança nos horários, o banco é atualizado automaticamente.</p>
              </div>
            </div>
          </div>

          {/* Atualização */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <RefreshCw className="h-4 w-4 text-primary" />
              Atualização dos dados
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Os horários são atualizados automaticamente toda segunda-feira.
              Apesar disso, horários podem mudar sem aviso prévio — confirme sempre
              com a empresa antes de viajar.
            </p>
          </div>

          {/* Sugerir rota */}
          <Link
            href="/suggest"
            className="flex items-center justify-between rounded-2xl border bg-card p-5 hover:bg-muted/30 transition-colors shadow-sm group"
          >
            <div>
              <p className="text-sm font-semibold text-foreground">Conhece uma linha que não está aqui?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Envie uma sugestão e ajude a comunidade.</p>
            </div>
            <span className="text-primary text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>

          {/* Rodapé */}
          <p className="text-center text-xs text-muted-foreground pt-2">
            BusOnTime © {new Date().getFullYear()} · Desenvolvido com ❤️ para o interior de SP
          </p>

        </div>
      </div>
    </>
  );
}