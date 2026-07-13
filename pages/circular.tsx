import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useState, useMemo, useEffect, useCallback } from "react";
import fs from "fs";
import path from "path";
import { format, isBefore, startOfToday } from "date-fns";
import { ChevronLeft, Bus, MapPin, Clock, Info, CalendarIcon, ClockIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BotaoAlarme from "@/components/BotaoAlarme";
import PainelAlarmes from "@/components/PainelAlarmes";

// ── Tipos ────────────────────────────────────────────────────────────────
type CircularSimples = {
  nome: string; descricao: string; atualizadoEm: string; fonte: string; contato: string;
  diasOperacao: string[]; pontos: string[];
  horariosPorPonto: Record<string, Record<string, string[]>>;
  observacoes: string[];
};
type LinhaComPontos = { id: string; nome: string; pontos: string[]; horarios: Record<string, Record<string, string[]>>; };
type CircularComLinhas = {
  nome: string; descricao: string; atualizadoEm: string; fonte: string; contato: string;
  diasOperacao: string[]; linhas: LinhaComPontos[]; observacoes: string[];
};
type Cidade = { id: string; nome: string; dados: CircularSimples | CircularComLinhas | null };
type Props = { cidades: Cidade[] };

const DIAS_SEMANA_MAP = ["Domingo e Feriados", "Segunda a Sexta", "Segunda a Sexta", "Segunda a Sexta", "Segunda a Sexta", "Segunda a Sexta", "Sábado"];

export const getStaticProps: GetStaticProps<Props> = async () => {
  function tentarLer(nomeArquivo: string) {
    try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "public", nomeArquivo), "utf-8")); }
    catch { return null; }
  }
  const cidades: Cidade[] = [
    { id: "brodowski", nome: "Brodowski", dados: tentarLer("circular-brodowski.json") },
    { id: "jardinopolis", nome: "Jardinópolis", dados: tentarLer("circular-jardinopolis.json") },
  ];
  return { props: { cidades } };
};

function temLinhas(dados: CircularSimples | CircularComLinhas): dados is CircularComLinhas {
  return "linhas" in dados;
}

function getDiaDaSemanaPorData(date: Date, diasDisponiveis: string[]): string {
  const nome = DIAS_SEMANA_MAP[date.getDay()];
  if (diasDisponiveis.includes(nome)) return nome;
  return diasDisponiveis.includes("Segunda a Sexta") ? "Segunda a Sexta" : diasDisponiveis[0];
}

function minutosDoHorario(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

function proximoIndice(horarios: string[], horaAtualStr: string): number {
  const horaAtualMin = minutosDoHorario(horaAtualStr);
  for (let i = 0; i < horarios.length; i++) {
    if (!horarios[i]) continue;
    if (minutosDoHorario(horarios[i]) >= horaAtualMin) return i;
  }
  return -1;
}

const INITIAL_DATE = new Date(2000, 0, 1);
const INITIAL_TIME = "00:00";

// ── Página ────────────────────────────────────────────────────────────────
export default function CircularesPage({ cidades }: Props) {
  const cidadesDisponiveis = cidades.filter((c) => c.dados !== null);

  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(INITIAL_DATE);
  const [selectedTime, setSelectedTime] = useState(INITIAL_TIME);

  const [cidadeId, setCidadeId] = useState(cidadesDisponiveis[0]?.id ?? "");
  const cidade = cidadesDisponiveis.find((c) => c.id === cidadeId);
  const dados = cidade?.dados ?? null;

  const linhas = dados && temLinhas(dados) ? dados.linhas : null;
  const [linhaId, setLinhaId] = useState(linhas?.[0]?.id ?? "");
  const linhaAtual = linhas?.find((l) => l.id === linhaId) ?? linhas?.[0] ?? null;

  const [pontoSelecionado, setPontoSelecionado] = useState("Rodoviária");
  const [viagemManual, setViagemManual] = useState<number | null>(null);

  // Corrige hidratação: só calcula data/hora reais depois de montar no cliente
  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
    setIsHydrated(true);
  }, []);

  const resetParaAgora = useCallback(() => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
  }, []);

  const diaAtivo = useMemo(() => {
    if (!dados || !isHydrated) return dados?.diasOperacao[0] ?? "Segunda a Sexta";
    return getDiaDaSemanaPorData(selectedDate, dados.diasOperacao);
  }, [dados, selectedDate, isHydrated]);

  const isHoje = isHydrated && format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

  const horariosBase = useMemo(() => {
    if (!dados) return {};
    if (temLinhas(dados)) return linhaAtual?.horarios[diaAtivo] ?? {};
    return dados.horariosPorPonto[diaAtivo] ?? {};
  }, [dados, linhaAtual, diaAtivo]);

  const pontosOrdenados = useMemo(() => {
    if (!dados) return [];
    const lista = temLinhas(dados) ? (linhaAtual?.pontos ?? []) : dados.pontos;
    // remove duplicatas mantendo ordem, já que a lista de pontos pode repetir nomes (ex: "Rodoviária")
    const vistos = new Set<string>();
    return lista.filter((p) => {
      const chaveExata = Object.keys(horariosBase).find((k) => k === p) ? p : null;
      if (!chaveExata) return false;
      if (vistos.has(chaveExata)) return false;
      vistos.add(chaveExata);
      return true;
    });
  }, [dados, linhaAtual, horariosBase]);

  const horariosDoPonto = horariosBase[pontoSelecionado] ?? [];
  const horariosValidos = horariosDoPonto.map((h, i) => ({ h, i })).filter((x) => x.h);

  const indiceAutoPonto = isHoje ? proximoIndice(horariosDoPonto, selectedTime) : -1;
  const viagemAtual = viagemManual ?? (indiceAutoPonto >= 0 ? indiceAutoPonto : 0);

  // Ponto onde o ônibus estaria "agora" dentro da viagem atual (para destaque na tabela completa)
  const indicePontoAtualNaViagem = useMemo(() => {
    if (!isHoje) return -1;
    for (const ponto of pontosOrdenados) {
      const t = horariosBase[ponto]?.[viagemAtual];
      if (t && minutosDoHorario(t) >= minutosDoHorario(selectedTime)) return pontosOrdenados.indexOf(ponto);
    }
    return -1;
  }, [pontosOrdenados, horariosBase, viagemAtual, isHoje, selectedTime]);

  function handleCidade(id: string) {
    setCidadeId(id);
    setPontoSelecionado("Rodoviária");
    setViagemManual(null);
    const nova = cidadesDisponiveis.find((c) => c.id === id)?.dados;
    if (nova && temLinhas(nova)) setLinhaId(nova.linhas[0]?.id ?? "");
  }

  function handleLinha(id: string) {
    setLinhaId(id);
    setPontoSelecionado("Rodoviária");
    setViagemManual(null);
  }

  function handleClicarPontoNaTabela(ponto: string) {
    setPontoSelecionado(ponto);
    // mantém a viagem atual se aquele ponto tiver horário nesse índice, senão reseta pra auto
    const temHorarioNesseIndice = Boolean(horariosBase[ponto]?.[viagemAtual]);
    if (!temHorarioNesseIndice) setViagemManual(null);
  }

  if (cidadesDisponiveis.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Bus className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">Nenhum circular disponível no momento.</p>
          <Link href="/" className="text-sm text-primary hover:underline mt-3 inline-block">Voltar para busca</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Circulares Municipais — BusOnTime</title>
        <meta name="description" content="Horários dos circulares municipais das cidades da região." />
      </Head>

      <div className="min-h-screen bg-background pb-16">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">

          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="h-4 w-4" /> Voltar para busca de suburbanos
            </Link>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-xl bg-primary/10 p-2.5"><Bus className="h-5 w-5 text-primary" /></div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Circulares Municipais</h1>
                {dados && <p className="text-xs text-muted-foreground">Atualizado em {new Date(dados.atualizadoEm).toLocaleDateString("pt-BR")}</p>}
              </div>
            </div>
            {dados && <p className="text-sm text-muted-foreground">{dados.descricao}</p>}
          </div>

          <PainelAlarmes />

          {/* Seletor completo */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 space-y-3">

              {/* Data + Hora — igual ao suburbano */}
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal text-sm h-10">
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {isHydrated ? format(selectedDate, "EEE, dd/MM") : "—"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} disabled={(date) => isBefore(date, startOfToday())} />
                  </PopoverContent>
                </Popover>
                <div className="relative w-32 shrink-0">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="pl-9 h-10 text-sm" />
                </div>
                <Button variant="outline" size="sm" onClick={resetParaAgora} title="Agora" className="shrink-0 px-2 h-10">
                  <Clock className="h-4 w-4" />
                </Button>
              </div>

              <Select value={cidadeId} onValueChange={handleCidade}>
                <SelectTrigger className="h-10 text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cidadesDisponiveis.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>

              {linhas && linhas.length > 1 && (
                <Select value={linhaId} onValueChange={handleLinha}>
                  <SelectTrigger className="h-10 text-sm">
                    <Bus className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />
                    <SelectValue placeholder="Selecione a linha" />
                  </SelectTrigger>
                  <SelectContent>
                    {linhas.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              <Select value={pontoSelecionado} onValueChange={(v) => { setPontoSelecionado(v); setViagemManual(null); }}>
                <SelectTrigger className="h-10 text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Seu ponto de embarque" />
                </SelectTrigger>
                <SelectContent>
                  {pontosOrdenados.map((ponto) => <SelectItem key={ponto} value={ponto}>{ponto}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Chips de horário do ponto selecionado */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  Horários em <span className="text-foreground">{pontoSelecionado}</span>:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {horariosValidos.map(({ h, i }) => {
                    const eProximo = i === indiceAutoPonto;
                    const eSelecionado = i === viagemAtual;
                    return (
                      <button
                        key={i}
                        onClick={() => setViagemManual(i)}
                        className={`rounded-full px-2.5 py-1 text-xs font-mono font-semibold tabular-nums border transition-colors ${
                          eSelecionado
                            ? "bg-primary text-primary-foreground border-primary"
                            : eProximo
                              ? "border-primary/60 text-primary bg-primary/5"
                              : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Próximo — destaque grande */}
          {indiceAutoPonto >= 0 && (
            <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 dark:bg-primary/10 p-4 flex items-center gap-4">
              <div className="shrink-0 flex flex-col items-center">
                <span className="text-4xl font-bold tabular-nums text-primary leading-none">{horariosDoPonto[indiceAutoPonto]}</span>
                <span className="text-xs font-medium text-primary/70 mt-1">
                  em {minutosDoHorario(horariosDoPonto[indiceAutoPonto]) - minutosDoHorario(selectedTime)} min
                </span>
              </div>
              <div className="flex-1 border-l border-primary/20 pl-4">
                <p className="text-sm font-semibold text-foreground">Próxima passagem</p>
                <p className="text-xs text-muted-foreground mt-0.5">{cidade?.nome} · {pontoSelecionado}</p>
              </div>
              <BotaoAlarme horario={horariosDoPonto[indiceAutoPonto]} origem={pontoSelecionado} destino={`Circular ${cidade?.nome}`} empresa={`Circular de ${cidade?.nome}`} />
            </div>
          )}

          {/* Itinerário completo, ponto a ponto, para a viagem selecionada */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Itinerário completo
              </span>
              <span className="text-xs text-muted-foreground">
                viagem de {horariosBase[pontoSelecionado]?.[viagemAtual] ?? "—"} em {pontoSelecionado}
              </span>
            </div>
            <div className="divide-y max-h-[28rem] overflow-y-auto">
              {pontosOrdenados.map((ponto, idx) => {
                const t = horariosBase[ponto]?.[viagemAtual];
                const eSelecionado = ponto === pontoSelecionado;
                const eProximoReal = idx === indicePontoAtualNaViagem;
                return (
                  <button
                    key={ponto}
                    onClick={() => handleClicarPontoNaTabela(ponto)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      eSelecionado ? "bg-primary/10" : eProximoReal ? "bg-amber-50 dark:bg-amber-900/10" : "hover:bg-muted/20"
                    }`}
                  >
                    <span className={`font-mono text-sm font-bold tabular-nums w-14 shrink-0 ${eSelecionado ? "text-primary" : "text-foreground"}`}>
                      {t ?? "—"}
                    </span>
                    <span className={`flex-1 text-sm truncate ${eSelecionado ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {ponto}
                    </span>
                    {eSelecionado && <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">seu ponto</span>}
                    {eProximoReal && !eSelecionado && <span className="shrink-0 rounded-full bg-amber-400/80 px-2 py-0.5 text-[10px] font-semibold text-amber-950">próximo</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {dados && dados.observacoes.length > 0 && (
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3"><Info className="h-4 w-4 text-primary" /> Observações</h2>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {dados.observacoes.map((obs, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{obs}</li>)}
              </ul>
            </div>
          )}

          {dados && (
            <div className="rounded-2xl border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Fonte oficial</p>
              <p>{dados.fonte}</p>
              {dados.contato && <p>{dados.contato}</p>}
            </div>
          )}

        </div>
      </div>
    </>
  );
}