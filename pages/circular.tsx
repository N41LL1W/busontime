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

// ── Tipos (suporta os dois formatos: Brodowski simples e Jardinópolis com linhas) ──
type CircularSimples = {
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

type LinhaComPontos = {
  id: string;
  nome: string;
  pontos: string[];
  horarios: Record<string, Record<string, string[]>>;
};

type CircularComLinhas = {
  nome: string;
  descricao: string;
  atualizadoEm: string;
  fonte: string;
  contato: string;
  diasOperacao: string[];
  linhas: LinhaComPontos[];
  observacoes: string[];
};

type Cidade = {
  id: string;
  nome: string;
  dados: CircularSimples | CircularComLinhas | null;
};

type Props = {
  cidades: Cidade[];
};

// ── getStaticProps ────────────────────────────────────────────────────────
export const getStaticProps: GetStaticProps<Props> = async () => {
  function tentarLer(nomeArquivo: string) {
    try {
      const p = path.join(process.cwd(), "public", nomeArquivo);
      return JSON.parse(fs.readFileSync(p, "utf-8"));
    } catch {
      return null;
    }
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

function proximoHorario(horarios: string[]): { horario: string; minutos: number } | null {
  const agora = new Date();
  const horaAtual = agora.getHours() * 60 + agora.getMinutes();
  for (const h of horarios) {
    if (!h) continue;
    const [hh, mm] = h.split(":").map(Number);
    const minutosH = hh * 60 + mm;
    if (minutosH >= horaAtual) return { horario: h, minutos: minutosH - horaAtual };
  }
  return null;
}

function getDiaAtivo(diasDisponiveis: string[]): string {
  const dia = new Date().getDay();
  if (dia === 6 && diasDisponiveis.includes("Sábado")) return "Sábado";
  return diasDisponiveis.includes("Segunda a Sexta") ? "Segunda a Sexta" : diasDisponiveis[0];
}

// ── Página ────────────────────────────────────────────────────────────────
export default function CircularesPage({ cidades }: Props) {
  const cidadesDisponiveis = cidades.filter((c) => c.dados !== null);

  const [cidadeId, setCidadeId] = useState(cidadesDisponiveis[0]?.id ?? "");
  const cidade = cidadesDisponiveis.find((c) => c.id === cidadeId);
  const dados = cidade?.dados ?? null;

  const linhas = dados && temLinhas(dados) ? dados.linhas : null;
  const [linhaId, setLinhaId] = useState(linhas?.[0]?.id ?? "");

  const [diaAtivo, setDiaAtivo] = useState(dados ? getDiaAtivo(dados.diasOperacao) : "Segunda a Sexta");
  const [pontoSelecionado, setPontoSelecionado] = useState("Rodoviária");

  const linhaAtual = linhas?.find((l) => l.id === linhaId) ?? linhas?.[0] ?? null;

  const pontos = useMemo(() => {
    if (!dados) return [];
    if (temLinhas(dados)) {
      return linhaAtual ? Object.keys(linhaAtual.horarios[diaAtivo] ?? {}) : [];
    }
    return Object.keys(dados.horariosPorPonto[diaAtivo] ?? {});
  }, [dados, linhaAtual, diaAtivo]);

  const horariosDoPonto = useMemo(() => {
    if (!dados) return [];
    if (temLinhas(dados)) {
      return linhaAtual?.horarios[diaAtivo]?.[pontoSelecionado] ?? [];
    }
    return dados.horariosPorPonto[diaAtivo]?.[pontoSelecionado] ?? [];
  }, [dados, linhaAtual, diaAtivo, pontoSelecionado]);

  const horariosValidos = horariosDoPonto.filter((h) => h);
  const proximo = proximoHorario(horariosValidos);
  const isHojeEDiaCorreto = dados ? diaAtivo === getDiaAtivo(dados.diasOperacao) : false;

  function handleCidade(id: string) {
    setCidadeId(id);
    setPontoSelecionado("Rodoviária");
    const novaCidade = cidadesDisponiveis.find((c) => c.id === id);
    const novosDados = novaCidade?.dados;
    if (novosDados) {
      setDiaAtivo(getDiaAtivo(novosDados.diasOperacao));
      if (temLinhas(novosDados)) {
        setLinhaId(novosDados.linhas[0]?.id ?? "");
      }
    }
  }

  function handleLinha(id: string) {
    setLinhaId(id);
    setPontoSelecionado("Rodoviária");
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

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" /> Voltar para busca
          </Link>

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

          {/* Seletor: cidade > linha (se houver) > dia > ponto */}
          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="p-4 space-y-3">
              <Select value={cidadeId} onValueChange={handleCidade}>
                <SelectTrigger className="h-10 text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  {cidadesDisponiveis.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {linhas && linhas.length > 1 && (
                <Select value={linhaId} onValueChange={handleLinha}>
                  <SelectTrigger className="h-10 text-sm">
                    <Bus className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />
                    <SelectValue placeholder="Selecione a linha" />
                  </SelectTrigger>
                  <SelectContent>
                    {linhas.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {dados && dados.diasOperacao.length > 1 && (
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
              )}

              <Select value={pontoSelecionado} onValueChange={setPontoSelecionado}>
                <SelectTrigger className="h-10 text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Selecione seu ponto de embarque" />
                </SelectTrigger>
                <SelectContent>
                  {pontos.map((ponto) => (
                    <SelectItem key={ponto} value={ponto}>{ponto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <p className="text-xs text-muted-foreground text-center">
                {horariosValidos.length} passagens em {pontoSelecionado}
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
                <p className="text-xs text-muted-foreground mt-0.5">{cidade?.nome} · {pontoSelecionado}</p>
              </div>
              <BotaoAlarme horario={proximo.horario} origem={pontoSelecionado} destino={`Circular ${cidade?.nome}`} empresa={`Circular de ${cidade?.nome}`} />
            </div>
          )}

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b bg-muted/20 flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Todos os horários</span>
            </div>
            {horariosValidos.length > 0 ? (
              <div className="divide-y">
                {horariosValidos.map((h, idx) => {
                  const eProximo = isHojeEDiaCorreto && proximo?.horario === h;
                  return (
                    <div key={`${h}-${idx}`} className={`flex items-center gap-3 px-4 py-3 transition-colors ${eProximo ? "bg-primary/5" : "hover:bg-muted/20"}`}>
                      <span className={`font-mono text-lg font-bold tabular-nums w-16 ${eProximo ? "text-primary" : "text-foreground"}`}>{h}</span>
                      {eProximo && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">próximo</span>}
                      <span className="flex-1 text-xs text-muted-foreground">Viagem {idx + 1}</span>
                      <BotaoAlarme horario={h} origem={pontoSelecionado} destino={`Circular ${cidade?.nome}`} empresa={`Circular de ${cidade?.nome}`} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-6 text-center">Nenhum horário para este ponto neste dia.</p>
            )}
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