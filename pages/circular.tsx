import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState, useMemo } from "react";
import fs from "fs";
import path from "path";
import { ChevronLeft, Bus, MapPin, Clock, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BotaoAlarme from "@/components/BotaoAlarme";
import PainelAlarmes from "@/components/PainelAlarmes";

type CircularData = {
  nome: string;
  descricao: string;
  atualizadoEm: string;
  fonte: string;
  contato: string;
  diasOperacao: string[];
  pontos: string[];
  horariosPorPonto: Record<string, Record<string, string[]>>;
  observacoes: string[];
};

type Props = {
  dados: CircularData | null;
  erro?: string;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const jsonPath = path.join(process.cwd(), "public", "circular-brodowski.json");
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const dados: CircularData = JSON.parse(raw);
    return { props: { dados } };
  } catch {
    return { props: { dados: null, erro: "Horários do circular ainda não disponíveis." } };
  }
};

function getDiaDaSemana(diasDisponiveis: string[]): string {
  const dia = new Date().getDay();
  if (dia === 6 && diasDisponiveis.includes("Sábado")) return "Sábado";
  return diasDisponiveis.includes("Segunda a Sexta") ? "Segunda a Sexta" : diasDisponiveis[0];
}

function proximoHorarioNoPonto(horarios: string[]): { horario: string; minutos: number } | null {
  const agora = new Date();
  const horaAtual = agora.getHours() * 60 + agora.getMinutes();
  for (const h of horarios) {
    const [hh, mm] = h.split(":").map(Number);
    const minutosH = hh * 60 + mm;
    if (minutosH >= horaAtual) return { horario: h, minutos: minutosH - horaAtual };
  }
  return null;
}

export default function CircularBrodowskiPage({ dados, erro }: Props) {
  const [diaAtivo, setDiaAtivo] = useState(dados ? getDiaDaSemana(dados.diasOperacao) : "Segunda a Sexta");
  const [pontoSelecionado, setPontoSelecionado] = useState<string>("Rodoviária");

  const pontosUnicos = useMemo(() => {
    if (!dados) return [];
    return Object.keys(dados.horariosPorPonto[diaAtivo] ?? {});
  }, [dados, diaAtivo]);

  if (erro || !dados) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Bus className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{erro ?? "Erro ao carregar dados."}</p>
          <Link href="/" className="text-sm text-primary hover:underline mt-3 inline-block">Voltar para a busca principal</Link>
        </div>
      </div>
    );
  }

  const horariosDoDia = dados.horariosPorPonto[diaAtivo] ?? {};
  const horariosDoPonto = horariosDoDia[pontoSelecionado] ?? [];
  const proximo = proximoHorarioNoPonto(horariosDoPonto);
  const isHojeEDiaCorreto = diaAtivo === getDiaDaSemana(dados.diasOperacao);

  return (
    <>
      <Head>
        <title>{dados.nome} — BusOnTime</title>
        <meta name="description" content={dados.descricao} />
      </Head>

      <div className="min-h-screen bg-background pb-16">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Voltar para busca
          </Link>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-primary/10 p-2.5">
                <Bus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{dados.nome}</h1>
                <p className="text-xs text-muted-foreground">Atualizado em {new Date(dados.atualizadoEm).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{dados.descricao}</p>
          </div>

          <PainelAlarmes />

          {/* Seletor compacto */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 space-y-3">
              <div className="flex rounded-xl border overflow-hidden">
                {dados.diasOperacao.map((dia) => (
                  <button
                    key={dia}
                    onClick={() => setDiaAtivo(dia)}
                    className={`flex-1 py-2 text-xs font-medium transition-colors ${diaAtivo === dia ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/30"}`}
                  >
                    {dia}
                  </button>
                ))}
              </div>

              <Select value={pontoSelecionado} onValueChange={setPontoSelecionado}>
                <SelectTrigger className="h-10 text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />
                  <SelectValue placeholder="Selecione seu ponto de embarque" />
                </SelectTrigger>
                <SelectContent>
                  {pontosUnicos.map((ponto) => (
                    <SelectItem key={ponto} value={ponto}>{ponto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground text-center">
                {horariosDoPonto.length} passagens em {pontoSelecionado}
              </p>
            </div>
          </div>

          {proximo && isHojeEDiaCorreto && (
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 dark:bg-primary/10 p-4 flex items-center gap-4">
              <div className="shrink-0 flex flex-col items-center">
                <span className="text-4xl font-bold tabular-nums text-primary leading-none">{proximo.horario}</span>
                <span className="text-xs font-medium text-primary/70 mt-1">{proximo.minutos === 0 ? "agora" : `em ${proximo.minutos} min`}</span>
              </div>
              <div className="flex-1 border-l border-primary/20 pl-4">
                <p className="text-sm font-semibold text-foreground">Próxima passagem</p>
                <p className="text-xs text-muted-foreground mt-0.5">{pontoSelecionado}</p>
              </div>
              <BotaoAlarme horario={proximo.horario} origem={pontoSelecionado} destino="Circular" empresa="Circular de Brodowski" />
            </div>
          )}

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Todos os horários</span>
            </div>
            {horariosDoPonto.length > 0 ? (
              <div className="divide-y">
                {horariosDoPonto.map((h, idx) => {
                  const eProximo = isHojeEDiaCorreto && proximo?.horario === h;
                  return (
                    <div key={h} className={`flex items-center gap-3 px-4 py-3 transition-colors ${eProximo ? "bg-primary/5" : "hover:bg-muted/20"}`}>
                      <span className={`font-mono text-lg font-bold tabular-nums w-16 ${eProximo ? "text-primary" : "text-foreground"}`}>{h}</span>
                      {eProximo && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">próximo</span>}
                      <span className="flex-1 text-xs text-muted-foreground">Viagem {idx + 1}</span>
                      <BotaoAlarme horario={h} origem={pontoSelecionado} destino="Circular" empresa="Circular de Brodowski" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-6 text-center">Nenhum horário para este ponto neste dia.</p>
            )}
          </div>

          <details className="rounded-2xl border bg-card shadow-sm overflow-hidden group">
            <summary className="px-4 py-3 border-b bg-muted/20 cursor-pointer text-sm font-semibold text-foreground flex items-center gap-2 list-none">
              <MapPin className="h-4 w-4 text-primary" />
              Ver trajeto completo ({dados.pontos.length} pontos)
              <span className="ml-auto text-xs text-muted-foreground group-open:hidden">mostrar</span>
              <span className="ml-auto text-xs text-muted-foreground hidden group-open:inline">ocultar</span>
            </summary>
            <div className="p-4 flex flex-wrap items-center gap-1.5 text-xs">
              {dados.pontos.map((ponto, i) => {
                const pontoLimpo = ponto.replace(" (2ª passagem)", "").replace(" (fim do circuito)", "");
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPontoSelecionado(pontoLimpo)}
                      className={`rounded-full px-2.5 py-1 font-medium transition-colors ${pontoSelecionado === pontoLimpo ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary"}`}
                    >
                      {ponto}
                    </button>
                    {i < dados.pontos.length - 1 && <span className="text-muted-foreground">→</span>}
                  </div>
                );
              })}
            </div>
          </details>

          {dados.observacoes.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-primary" /> Observações
              </h2>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {dados.observacoes.map((obs, i) => (
                  <li key={i} className="flex gap-2"><span className="text-primary">•</span>{obs}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Fonte oficial</p>
            <p>{dados.fonte}</p>
            <p>{dados.contato}</p>
          </div>

        </div>
      </div>
    </>
  );
}