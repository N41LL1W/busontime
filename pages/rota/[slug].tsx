import { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeftRight, Bus, MapPin, Clock, ExternalLink, ChevronLeft } from "lucide-react";
import prisma from "../../lib/prisma";
import BotaoAlarme from "../../components/BotaoAlarme";
import PainelAlarmes from "../../components/PainelAlarmes";

type Horario = {
  id: number;
  horario: string;
  diaDaSemana: string;
  sentido: string;
  tipo: string;
  observacao: string | null;
};

type Rota = {
  id: number;
  origem: string;
  destino: string;
  linha: string | null;
  tarifaComum: number | null;
  tarifaEstudante: number | null;
  empresa: { nome: string; slug: string; sourceUrl: string | null };
  horarios: Horario[];
};

type Props = {
  origem: string;
  destino: string;
  rotas: Rota[];
  rotasVolta: Rota[];
  slug: string;
};

const ORDEM_DIAS = ["Segunda a Sexta", "Sábado", "Domingo e Feriados"];

const empresaCor: Record<string, string> = {
  saobento:     "bg-blue-100 text-blue-800 border-blue-200",
  ribe:         "bg-green-100 text-green-800 border-green-200",
  rapidodoeste: "bg-violet-100 text-violet-800 border-violet-200",
};

const empresaCorDark: Record<string, string> = {
  saobento:     "dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
  ribe:         "dark:bg-green-900/30 dark:text-green-200 dark:border-green-800",
  rapidodoeste: "dark:bg-violet-900/30 dark:text-violet-200 dark:border-violet-800",
};

function slugify(texto: string) {
  return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function formatTarifa(valor: number | null) {
  return valor != null ? `R$ ${valor.toFixed(2).replace(".", ",")}` : null;
}

export const getStaticPaths: GetStaticPaths = async () => {
  const rotas = await prisma.rota.findMany({ where: { ativo: true }, select: { origem: true, destino: true } });
  const slugsVistos = new Set<string>();
  const paths: { params: { slug: string } }[] = [];
  for (const rota of rotas) {
    const slug = `${slugify(rota.origem)}-ate-${slugify(rota.destino)}`;
    if (!slugsVistos.has(slug)) { slugsVistos.add(slug); paths.push({ params: { slug } }); }
  }
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "");
  const todasRotas = await prisma.rota.findMany({
    where: { ativo: true },
    include: {
      empresa: { select: { nome: true, slug: true, sourceUrl: true } },
      horarios: { where: { ativo: true }, orderBy: { horario: "asc" } },
    },
  });

  let origem = "";
  let destino = "";
  for (const rota of todasRotas) {
    const s = `${slugify(rota.origem)}-ate-${slugify(rota.destino)}`;
    if (s === slug) { origem = rota.origem; destino = rota.destino; break; }
  }

  if (!origem || !destino) return { notFound: true };

  const rotas = todasRotas.filter((r) => r.origem === origem && r.destino === destino);
  const rotasVolta = todasRotas.filter((r) => r.origem === destino && r.destino === origem);

  return {
    props: {
      origem, destino, slug,
      rotas: JSON.parse(JSON.stringify(rotas)),
      rotasVolta: JSON.parse(JSON.stringify(rotasVolta)),
    },
  };
};

function TabelaHorarios({ rota, diaAtivo }: { rota: Rota; diaAtivo: string }) {
  const horariosDoDia = rota.horarios.filter((h) => h.diaDaSemana === diaAtivo && h.sentido === "ida");
  const slug = rota.empresa.slug;
  const corBadge = `${empresaCor[slug] ?? "bg-muted text-muted-foreground border-border"} ${empresaCorDark[slug] ?? ""}`;

  if (horariosDoDia.length === 0) {
    return <p className="text-sm text-muted-foreground italic py-4 text-center">Nenhum horário para este dia.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
            <th className="px-4 py-2.5 text-left font-medium">Horário</th>
            <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
            <th className="px-4 py-2.5 text-left font-medium">Observação</th>
            <th className="px-4 py-2.5 text-right font-medium w-14">Alarme</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {horariosDoDia.map((h) => (
            <tr key={h.id} className="hover:bg-muted/20 transition-colors">
              <td className="px-4 py-2.5">
                <span className="font-mono text-base font-bold tabular-nums text-foreground">{h.horario}</span>
              </td>
              <td className="px-4 py-2.5">
                {h.tipo === "intermediario" ? (
                  <span className="rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">ponto</span>
                ) : (
                  <span className="text-xs text-muted-foreground">rodoviária</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{h.observacao ?? "—"}</td>
              <td className="px-4 py-2.5 text-right">
                <BotaoAlarme horario={h.horario} origem={rota.origem} destino={rota.destino} empresa={rota.empresa.nome} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t bg-muted/20">
            <td colSpan={4} className="px-4 py-2 text-xs text-muted-foreground">
              {horariosDoDia.length} horário{horariosDoDia.length !== 1 ? "s" : ""}
              {" · "}
              <span className={`inline rounded-full px-2 py-0.5 text-xs font-medium border ${corBadge}`}>{rota.empresa.nome}</span>
              {rota.tarifaComum && <span className="ml-2">· {formatTarifa(rota.tarifaComum)}</span>}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function CardEmpresa({ rota, diaAtivo }: { rota: Rota; diaAtivo: string }) {
  const slug = rota.empresa.slug;
  const corBadge = `${empresaCor[slug] ?? "bg-muted text-muted-foreground border-border"} ${empresaCorDark[slug] ?? ""}`;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b bg-muted/20">
        <div className="flex items-center gap-2">
          <Bus className="h-4 w-4 text-muted-foreground" />
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${corBadge}`}>{rota.empresa.nome}</span>
          {rota.linha && <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[200px]">{rota.linha}</span>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            {rota.tarifaComum && <p className="text-sm font-semibold text-foreground">{formatTarifa(rota.tarifaComum)}</p>}
            {rota.tarifaEstudante && <p className="text-xs text-green-600 dark:text-green-400">Estudante {formatTarifa(rota.tarifaEstudante)}</p>}
          </div>
          {rota.empresa.sourceUrl && (
            <a href={rota.empresa.sourceUrl} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:text-primary rounded-full transition-colors" title="Ver fonte">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
      <TabelaHorarios rota={rota} diaAtivo={diaAtivo} />
    </div>
  );
}

export default function RotaPage({ origem, destino, rotas, rotasVolta }: Props) {
  const [diaAtivo, setDiaAtivo] = useState("Segunda a Sexta");
  const [sentido, setSentido] = useState<"ida" | "volta">("ida");

  const rotasAtuais = sentido === "ida" ? rotas : rotasVolta;
  const origemAtual = sentido === "ida" ? origem : destino;
  const destinoAtual = sentido === "ida" ? destino : origem;
  const slugVolta = `${slugify(destino)}-ate-${slugify(origem)}`;

  const totalEmpresas = rotasAtuais.length;
  const menorTarifa = Math.min(...rotasAtuais.map((r) => r.tarifaComum ?? Infinity).filter(isFinite));
  const temMultiplasEmpresas = rotasAtuais.length > 1;

  return (
    <>
      <Head>
        <title>{origem} → {destino} — Horários de Ônibus | BusOnTime</title>
        <meta name="description" content={`Horários de ônibus de ${origem} para ${destino}. ${totalEmpresas} empresa${totalEmpresas !== 1 ? "s" : ""} disponível${totalEmpresas !== 1 ? "is" : ""}.`} />
      </Head>

      <div className="min-h-screen bg-background pb-24">
        <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Voltar para busca
          </Link>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Linha de ônibus</p>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5"><MapPin className="h-5 w-5 text-primary shrink-0" />{origemAtual}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="flex items-center gap-1.5"><MapPin className="h-5 w-5 text-muted-foreground shrink-0" />{destinoAtual}</span>
                </h1>
              </div>
              <button
                onClick={() => setSentido(sentido === "ida" ? "volta" : "ida")}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <ArrowLeftRight className="h-4 w-4" /> {sentido === "ida" ? "Ver volta" : "Ver ida"}
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Empresas</p>
                <p className="text-lg font-bold text-foreground">{totalEmpresas}</p>
              </div>
              {isFinite(menorTarifa) && (
                <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
                  <p className="text-xs text-muted-foreground">A partir de</p>
                  <p className="text-lg font-bold text-foreground">{formatTarifa(menorTarifa)}</p>
                </div>
              )}
              <div className="rounded-xl bg-muted/40 px-3 py-2 text-center">
                <p className="text-xs text-muted-foreground">Horários hoje</p>
                <p className="text-lg font-bold text-foreground">
                  {rotasAtuais.reduce((acc, r) => acc + r.horarios.filter((h) => h.diaDaSemana === diaAtivo && h.sentido === "ida").length, 0)}
                </p>
              </div>
            </div>
          </div>

          <PainelAlarmes />

          {temMultiplasEmpresas && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">🎫 Comparativo de tarifas</h2>
              <div className="space-y-2">
                {rotasAtuais.filter((r) => r.tarifaComum).sort((a, b) => (a.tarifaComum ?? 0) - (b.tarifaComum ?? 0)).map((rota) => {
                  const slug = rota.empresa.slug;
                  const corBadge = `${empresaCor[slug] ?? ""} ${empresaCorDark[slug] ?? ""}`;
                  const eMaisBarata = rota.tarifaComum === menorTarifa;
                  return (
                    <div key={rota.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${eMaisBarata ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "bg-muted/20"}`}>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${corBadge}`}>{rota.empresa.nome}</span>
                        {eMaisBarata && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ mais barata</span>}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatTarifa(rota.tarifaComum)}</p>
                        {rota.tarifaEstudante && <p className="text-xs text-green-600 dark:text-green-400">Estudante: {formatTarifa(rota.tarifaEstudante)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex rounded-xl border bg-card overflow-hidden shadow-sm">
            {ORDEM_DIAS.map((dia) => (
              <button
                key={dia}
                onClick={() => setDiaAtivo(dia)}
                className={`flex-1 py-3 text-xs font-medium transition-colors border-b-2 ${diaAtivo === dia ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"}`}
              >
                {dia === "Segunda a Sexta" ? "Seg–Sex" : dia === "Sábado" ? "Sábado" : "Dom/Fer"}
              </button>
            ))}
          </div>

          {rotasAtuais.length > 0 ? (
            <div className="space-y-4">
              {rotasAtuais.map((rota) => <CardEmpresa key={rota.id} rota={rota} diaAtivo={diaAtivo} />)}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed bg-card p-10 text-center">
              <Bus className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhuma rota encontrada para {origemAtual} → {destinoAtual}.</p>
              <p className="text-sm text-muted-foreground mt-1">Tente a direção inversa ou verifique a busca principal.</p>
            </div>
          )}

          <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">ℹ️ Informações sobre a linha</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              {rotasAtuais.map((rota) => rota.empresa.sourceUrl && (
                <div key={rota.id} className="flex items-center justify-between">
                  <span>{rota.empresa.nome}</span>
                  <a href={rota.empresa.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                    Ver site oficial <ExternalLink size={11} />
                  </a>
                </div>
              ))}
              <p className="text-xs border-t pt-2">
                <Clock className="inline h-3 w-3 mr-1" /> Horários sujeitos a alteração. Confirme sempre com a empresa antes de viajar.
              </p>
            </div>
          </div>

          {rotasVolta.length > 0 && sentido === "ida" && (
            <Link href={`/rota/${slugVolta}`} className="flex items-center justify-between rounded-2xl border bg-card p-4 hover:bg-muted/30 transition-colors shadow-sm group">
              <div>
                <p className="text-sm font-semibold text-foreground">Ver página completa da volta</p>
                <p className="text-xs text-muted-foreground mt-0.5">{destino} → {origem}</p>
              </div>
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}