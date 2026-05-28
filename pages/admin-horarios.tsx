import { GetServerSideProps } from "next";
import { useState } from "react";
import path from "path";
import fs from "fs";

// ── Tipos ────────────────────────────────────────────────────────────────
type RotasJson = {
  mapa: Record<string, string[]>;
  todas_cidades: string[];
};

type Horario = {
  horario: string;
  tipo: "rodoviaria" | "intermediario";
};

type Sentido = {
  diaDaSemana: string;
  origem: string;
  destino: string;
  horarios: Horario[];
};

type DadosScraper = {
  linha: string;
  tarifas: Array<{ tipo: string; valor: string }>;
  sentidos: Sentido[];
};

type LogEntry = {
  origem: string;
  destino: string;
  empresa: string;
  status: "sucesso" | "erro" | "vazio";
  total: number;
  erro?: string;
  executadoEm: string;
};

type Props = { rotas: RotasJson };

const ORDEM_DIAS = ["Segunda a Sexta", "Sábado", "Domingo e Feriados"];

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const jsonPath = path.join(process.cwd(), "public", "rotas-saobento.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  return { props: { rotas: JSON.parse(raw) } };
};

export default function AdminHorarios({ rotas }: Props) {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [dados, setDados] = useState<DadosScraper | null>(null);
  const [diaAtivo, setDiaAtivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRibe, setLoadingRibe] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [msgSalvo, setMsgSalvo] = useState<string | null>(null);

  const destinosDisponiveis = origem ? (rotas.mapa[origem] ?? []) : [];

  function handleOrigem(v: string) {
    setOrigem(v);
    setDestino("");
    setDados(null);
    setErro(null);
  }

  // ── São Bento: buscar rota específica ────────────────────────────────
  async function buscarHorarios() {
    if (!origem || !destino) return;
    setLoading(true);
    setErro(null);
    setDados(null);
    setMsgSalvo(null);
    try {
      const res = await fetch("/api/admin/scrape-saobento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem, destino }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar");
      setDados(json);
      setDiaAtivo(json.sentidos?.[0]?.diaDaSemana ?? "");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  // ── São Bento: salvar no banco ───────────────────────────────────────
  async function salvarNoBanco() {
    if (!dados) return;
    setSalvando(true);
    setMsgSalvo(null);
    setErro(null);
    try {
      const res = await fetch("/api/admin/salvar-horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem, destino, ...dados }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar");
      setMsgSalvo(`✅ ${json.message}`);
      addLog(origem, destino, "São Bento", "sucesso", json.total);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setErro(msg);
      addLog(origem, destino, "São Bento", "erro", 0, msg);
    } finally {
      setSalvando(false);
    }
  }

  // ── São Bento: buscar e salvar TODAS ────────────────────────────────
  async function buscarTodas() {
    const combos: Array<{ origem: string; destino: string }> = [];
    for (const [org, dests] of Object.entries(rotas.mapa)) {
      for (const dest of dests) combos.push({ origem: org, destino: dest });
    }
    setErro(null);
    setMsgSalvo(null);
    setLoading(true);
    for (const combo of combos) {
      try {
        const res = await fetch("/api/admin/scrape-e-salvar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(combo),
        });
        const json = await res.json();
        addLog(combo.origem, combo.destino, "São Bento", res.ok ? "sucesso" : "erro", json.total ?? 0, json.error);
      } catch (e: unknown) {
        addLog(combo.origem, combo.destino, "São Bento", "erro", 0, e instanceof Error ? e.message : "Erro");
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
    setLoading(false);
    setMsgSalvo("✅ Todas as rotas São Bento processadas!");
  }

  // ── Ribe: buscar e salvar ────────────────────────────────────────────
  async function buscarRibe() {
    setLoadingRibe(true);
    setErro(null);
    setMsgSalvo(null);
    try {
      const res = await fetch("/api/admin/scrape-ribe", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao buscar Ribe");
      setMsgSalvo(`✅ ${json.message}`);
      addLog("Ribeirão Preto / Jardinópolis", "↔", "Ribe", "sucesso", json.total ?? 0);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro desconhecido";
      setErro(msg);
      addLog("Ribe", "↔", "Ribe", "erro", 0, msg);
    } finally {
      setLoadingRibe(false);
    }
  }

  // ── Helper log ───────────────────────────────────────────────────────
  function addLog(origem: string, destino: string, empresa: string, status: LogEntry["status"], total: number, erro?: string) {
    setLogs((prev) => [
      { origem, destino, empresa, status, total, erro, executadoEm: new Date().toISOString() },
      ...prev,
    ]);
  }

  const dias = dados
    ? [...new Set(dados.sentidos.map((s) => s.diaDaSemana))].sort(
        (a, b) =>
          (ORDEM_DIAS.indexOf(a) === -1 ? 99 : ORDEM_DIAS.indexOf(a)) -
          (ORDEM_DIAS.indexOf(b) === -1 ? 99 : ORDEM_DIAS.indexOf(b))
      )
    : [];

  const sentidosFiltrados = dados
    ? dados.sentidos.filter((s) => s.diaDaSemana === diaAtivo)
    : [];

  return (
    <main className="min-h-screen bg-gray-950 p-4 md:p-8 text-gray-100">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Admin · Uso exclusivo local
          </p>
          <h1 className="mt-1 text-2xl font-bold">🚌 Gerenciar horários</h1>
          <p className="mt-1 text-sm text-gray-400">
            Busca nos sites e salva no banco PostgreSQL (Neon)
          </p>
        </div>

        {/* ── Seção Ribe ── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-cyan-300">🚍 Ribe Transporte</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Ribeirão Preto ↔ Jardinópolis · 2 sentidos · HTML estático
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={buscarRibe}
              disabled={loadingRibe || loading}
              className="rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-2"
            >
              {loadingRibe ? <Spinner /> : "🔄"} Buscar e salvar Ribe
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>ribetransporte.com.br/ribeirao-preto-a-jardinopolis</span>
              <span>·</span>
              <span>ribetransporte.com.br/linha-01</span>
            </div>
          </div>
        </div>

        {/* ── Seção São Bento ── */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 space-y-4">
          <div>
            <p className="text-sm font-semibold text-cyan-300">🚌 Viação São Bento</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {Object.keys(rotas.mapa).length} origens · {Object.values(rotas.mapa).reduce((a, b) => a + b.length, 0)} combinações · Puppeteer
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-400">📍 Origem</label>
              <select
                value={origem}
                onChange={(e) => handleOrigem(e.target.value)}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Selecione a origem...</option>
                {rotas.todas_cidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { setOrigem(destino); setDestino(origem); setDados(null); }}
              disabled={!origem || !destino}
              className="shrink-0 self-center rounded-full border border-gray-700 p-2.5 text-cyan-400 hover:border-cyan-500 disabled:opacity-30"
            >⇄</button>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-gray-400">📍 Destino</label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                disabled={!origem}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-gray-100 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">{origem ? "Selecione o destino..." : "Selecione a origem primeiro"}</option>
                {destinosDisponiveis.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={buscarHorarios}
              disabled={!origem || !destino || loading}
              className="rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-bold text-gray-950 hover:bg-cyan-400 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Spinner /> : "🔍"} Buscar horários
            </button>

            {dados && (
              <button
                onClick={salvarNoBanco}
                disabled={salvando}
                className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-500 disabled:opacity-50 flex items-center gap-2"
              >
                {salvando ? <Spinner /> : "💾"} Salvar no banco
              </button>
            )}

            <button
              onClick={buscarTodas}
              disabled={loading || loadingRibe}
              className="rounded-xl border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:border-gray-500 disabled:opacity-50 flex items-center gap-2 ml-auto"
            >
              {loading ? <Spinner /> : "⚡"} Buscar e salvar TODAS
            </button>
          </div>

          {erro && (
            <div className="rounded-xl border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
              ⚠️ {erro}
            </div>
          )}
          {msgSalvo && (
            <div className="rounded-xl border border-green-800 bg-green-950/50 px-4 py-3 text-sm text-green-300">
              {msgSalvo}
            </div>
          )}
        </div>

        {/* Preview dos horários buscados */}
        {dados && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 px-6 py-4">
              <div>
                <h2 className="font-bold text-lg">{dados.linha}</h2>
                <p className="text-sm text-gray-400">{origem} ↔ {destino}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {dados.tarifas?.map((t) => (
                  <span key={t.tipo} className="rounded-full bg-cyan-400/10 px-3 py-1 text-sm text-cyan-200">
                    🎫 {t.tipo} <strong>{t.valor}</strong>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex border-b border-gray-800">
              {dias.map((dia) => (
                <button
                  key={dia}
                  onClick={() => setDiaAtivo(dia)}
                  className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                    diaAtivo === dia
                      ? "border-b-2 border-cyan-400 text-cyan-300"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>

            <div className="divide-y divide-gray-800">
              {sentidosFiltrados.map((sentido, si) => (
                <div key={si} className="px-6 py-4">
                  <div className="mb-3 flex items-center gap-3">
                    <h3 className="font-medium text-gray-200">{sentido.origem} → {sentido.destino}</h3>
                    <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs text-gray-400">
                      {sentido.horarios.length} horários
                    </span>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-gray-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 bg-gray-800/50 text-xs text-gray-500">
                          <th className="px-4 py-2.5 text-left w-8">#</th>
                          <th className="px-4 py-2.5 text-left">Horário</th>
                          <th className="px-4 py-2.5 text-left">Tipo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {sentido.horarios.map((h, hi) => (
                          <tr key={hi} className="hover:bg-gray-800/50">
                            <td className="px-4 py-2 text-gray-600 text-xs">{hi + 1}</td>
                            <td className="px-4 py-2 font-mono text-lg font-bold text-gray-100">{h.horario}</td>
                            <td className="px-4 py-2">
                              {h.tipo === "intermediario" ? (
                                <span className="rounded-full bg-amber-400/10 px-2.5 py-0.5 text-xs text-amber-300">🟡 Ponto</span>
                              ) : (
                                <span className="rounded-full bg-cyan-400/10 px-2.5 py-0.5 text-xs text-cyan-300">🔵 Rodoviária</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log */}
        {logs.length > 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden">
            <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-200">📋 Log de operações</h2>
              <button onClick={() => setLogs([])} className="text-xs text-gray-600 hover:text-gray-400">
                Limpar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-xs text-gray-500">
                    <th className="px-4 py-3 text-left">Rota</th>
                    <th className="px-4 py-3 text-left">Empresa</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Horários</th>
                    <th className="px-4 py-3 text-left">Hora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {logs.map((log, i) => (
                    <tr key={i} className="hover:bg-gray-800/50">
                      <td className="px-4 py-2.5 text-gray-300 whitespace-nowrap">
                        {log.origem} → {log.destino}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{log.empresa}</td>
                      <td className="px-4 py-2.5">
                        {log.status === "sucesso" ? (
                          <span className="rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs text-green-400">✅ Sucesso</span>
                        ) : log.status === "vazio" ? (
                          <span className="rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-xs text-yellow-400">⚠️ Vazio</span>
                        ) : (
                          <span className="rounded-full bg-red-400/10 px-2.5 py-0.5 text-xs text-red-400" title={log.erro}>❌ Erro</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-400">{log.total}</td>
                      <td className="px-4 py-2.5 text-gray-600 text-xs">
                        {new Date(log.executadoEm).toLocaleTimeString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
