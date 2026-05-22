import { useState } from "react";

// ── Tipos ────────────────────────────────────────────────────────────────
type Horario = {
  horario: string;
  tipo: "rodoviaria" | "intermediario";
  observacao: string;
};

type Sentido = {
  diaDaSemana: string;
  origem: string;
  destino: string;
  totalInformado: number | null;
  horarios: Horario[];
  pontosDeParada: string[];
};

type Consulta = {
  origemSelecionada: string;
  destinoSelecionado: string;
  linha: string | null;
  tarifas: Array<{ tipo: string; valor: string }>;
  sentidos: Sentido[];
  textoVisivel: string;
};

type ResultadoOk = {
  ok: true;
  sourceUrl: string;
  pesquisadoEm: string;
  opcoesOrigem: string[];
  opcoesDestino: string[];
  consultas: Consulta[];
};

type ResultadoErro = { ok: false; error: string };
type Resultado = ResultadoOk | ResultadoErro;

// Dias na ordem certa para ordenar a tabela
const ORDEM_DIAS = ["Segunda a Sexta", "Sábado", "Domingo e Feriados"];

function ordenarHorarios(horarios: Horario[]) {
  return [...horarios].sort((a, b) => a.horario.localeCompare(b.horario));
}

function ordenarSentidos(sentidos: Sentido[]) {
  return [...sentidos].sort((a, b) => {
    const diaA = ORDEM_DIAS.indexOf(a.diaDaSemana);
    const diaB = ORDEM_DIAS.indexOf(b.diaDaSemana);
    if (diaA !== diaB) return (diaA === -1 ? 99 : diaA) - (diaB === -1 ? 99 : diaB);
    return `${a.origem}${a.destino}`.localeCompare(`${b.origem}${b.destino}`, "pt-BR");
  });
}

// ── Componente principal ──────────────────────────────────────────────────
export default function TesteSemiurbanoPage() {
  const [opcoesOrigem, setOpcoesOrigem] = useState<string[]>([]);
  const [opcoesDestino, setOpcoesDestino] = useState<string[]>([]);
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [meta, setMeta] = useState<{ sourceUrl: string; pesquisadoEm: string } | null>(null);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [diaAtivo, setDiaAtivo] = useState<string>("");
  const [textoVisivel, setTextoVisivel] = useState(false);

  // Carrega opções de cidades disparando o scraper uma vez
  async function carregarOpcoes() {
    setCarregandoOpcoes(true);
    setErro(null);
    try {
      const res = await fetch("/api/teste-semiurbano", { method: "POST" });
      const data = (await res.json()) as Resultado;
      if (!data.ok) throw new Error((data as ResultadoErro).error);
      setOpcoesOrigem(data.opcoesOrigem);
      setOpcoesDestino(data.opcoesDestino);
      setConsultas(data.consultas);
      setMeta({ sourceUrl: data.sourceUrl, pesquisadoEm: data.pesquisadoEm });
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregandoOpcoes(false);
    }
  }

  // Filtra consulta pela combinação origem/destino já carregada
  function buscarConsulta() {
    if (!origem || !destino) return;
    const found = consultas.find(
      (c) =>
        c.origemSelecionada.toLowerCase() === origem.toLowerCase() &&
        c.destinoSelecionado.toLowerCase() === destino.toLowerCase()
    );
    if (!found) {
      setErro(`Nenhum horário encontrado para ${origem} → ${destino}`);
      setConsultaSelecionada(null);
      return;
    }
    setErro(null);
    setConsultaSelecionada(found);
    setDiaAtivo(found.sentidos[0]?.diaDaSemana ?? "");
    setTextoVisivel(false);
  }

  // Busca direta para uma rota específica (sem carregar tudo)
  async function buscarDireto() {
    if (!origem || !destino) return;
    setCarregando(true);
    setErro(null);
    setConsultaSelecionada(null);
    try {
      const res = await fetch("/api/teste-semiurbano", { method: "POST" });
      const data = (await res.json()) as Resultado;
      if (!data.ok) throw new Error((data as ResultadoErro).error);
      setOpcoesOrigem(data.opcoesOrigem);
      setOpcoesDestino(data.opcoesDestino);
      setConsultas(data.consultas);
      setMeta({ sourceUrl: data.sourceUrl, pesquisadoEm: data.pesquisadoEm });
      const found = data.consultas.find(
        (c) =>
          c.origemSelecionada.toLowerCase() === origem.toLowerCase() &&
          c.destinoSelecionado.toLowerCase() === destino.toLowerCase()
      );
      if (!found) {
        setErro(`Nenhum horário encontrado para ${origem} → ${destino}`);
      } else {
        setConsultaSelecionada(found);
        setDiaAtivo(found.sentidos[0]?.diaDaSemana ?? "");
      }
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setCarregando(false);
    }
  }

  const sentidosFiltrados = consultaSelecionada
    ? ordenarSentidos(consultaSelecionada.sentidos).filter((s) => s.diaDaSemana === diaAtivo)
    : [];

  const diasDisponiveis = consultaSelecionada
    ? [...new Set(ordenarSentidos(consultaSelecionada.sentidos).map((s) => s.diaDaSemana))]
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
                Teste de raspagem
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                🚌 Semiurbano São Bento
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Abre o site, seleciona cidades, extrai horários via Puppeteer
              </p>
            </div>
            {meta && (
              <div className="rounded-xl bg-gray-100 px-4 py-2 text-xs text-gray-500">
                <p>📡 {meta.sourceUrl}</p>
                <p>🕐 {new Date(meta.pesquisadoEm).toLocaleString("pt-BR")}</p>
              </div>
            )}
          </div>

          {/* Seletores */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">📍 Origem</label>
              {opcoesOrigem.length > 0 ? (
                <select
                  value={origem}
                  onChange={(e) => { setOrigem(e.target.value); setConsultaSelecionada(null); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione a origem...</option>
                  {opcoesOrigem.map((c) => (
                    <option key={c} value={c} disabled={c === destino}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value)}
                  placeholder="Ex: Brodowski"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <button
              onClick={() => { setOrigem(destino); setDestino(origem); setConsultaSelecionada(null); }}
              disabled={!origem || !destino}
              className="shrink-0 self-center rounded-full border border-blue-200 bg-white p-2.5 text-blue-600 hover:bg-blue-50 disabled:opacity-40 sm:mb-0"
              title="Inverter"
            >
              ⇄
            </button>

            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-gray-600">📍 Destino</label>
              {opcoesDestino.length > 0 ? (
                <select
                  value={destino}
                  onChange={(e) => { setDestino(e.target.value); setConsultaSelecionada(null); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o destino...</option>
                  {opcoesDestino.map((c) => (
                    <option key={c} value={c} disabled={c === origem}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  placeholder="Ex: Ribeirão Preto"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          {/* Botões */}
          <div className="mt-4 flex flex-wrap gap-3">
            {/* Passo 1: carregar todas as opções */}
            <button
              onClick={carregarOpcoes}
              disabled={carregandoOpcoes || carregando}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              {carregandoOpcoes ? (
                <><Spinner /> Carregando cidades...</>
              ) : (
                "1️⃣ Carregar cidades disponíveis"
              )}
            </button>

            {/* Passo 2: buscar rota específica */}
            {opcoesOrigem.length > 0 && origem && destino && (
              <button
                onClick={buscarConsulta}
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 flex items-center gap-2"
              >
                2️⃣ Ver horários desta rota
              </button>
            )}

            {/* Busca direta (sem pré-carregar) */}
            {origem && destino && (
              <button
                onClick={buscarDireto}
                disabled={carregando || carregandoOpcoes}
                className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {carregando ? <><Spinner /> Buscando...</> : "🔍 Busca direta"}
              </button>
            )}
          </div>

          {/* Cidades disponíveis detectadas */}
          {opcoesOrigem.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="text-xs font-medium text-gray-500">Cidades detectadas:</span>
              {opcoesOrigem.map((c) => (
                <button
                  key={c}
                  onClick={() => { setOrigem(c); setConsultaSelecionada(null); }}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                    origem === c
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {erro && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠️ {erro}
            </div>
          )}
        </div>

        {/* Resultados */}
        {consultaSelecionada && (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

            {/* Cabeçalho da rota */}
            <div className="border-b bg-gray-50 px-6 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    🚌 {consultaSelecionada.linha ?? `${consultaSelecionada.origemSelecionada} X ${consultaSelecionada.destinoSelecionado}`}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {consultaSelecionada.origemSelecionada} → {consultaSelecionada.destinoSelecionado}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {consultaSelecionada.tarifas.map((t) => (
                    <span
                      key={t.tipo}
                      className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800"
                    >
                      🎫 {t.tipo}: <strong>{t.valor}</strong>
                    </span>
                  ))}
                  {consultaSelecionada.tarifas.length === 0 && (
                    <span className="text-xs text-gray-400">Tarifas não detectadas</span>
                  )}
                </div>
              </div>

              {/* Tabs de dia */}
              {diasDisponiveis.length > 0 && (
                <div className="mt-4 flex gap-2 flex-wrap">
                  {diasDisponiveis.map((dia) => (
                    <button
                      key={dia}
                      onClick={() => setDiaAtivo(dia)}
                      className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                        diaAtivo === dia
                          ? "bg-blue-600 text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300"
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabelas por sentido */}
            <div className="divide-y">
              {sentidosFiltrados.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-gray-400">
                  Nenhum horário encontrado para este dia.
                </p>
              )}

              {sentidosFiltrados.map((sentido) => {
                const horarios = ordenarHorarios(sentido.horarios);
                const totalCapturado = horarios.length;
                const totalInformado = sentido.totalInformado;
                const bate = totalInformado === null || totalInformado === totalCapturado;

                return (
                  <div key={`${sentido.diaDaSemana}-${sentido.origem}-${sentido.destino}`} className="px-6 py-5">
                    {/* Sub-cabeçalho do sentido */}
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-gray-800">
                        {sentido.origem} → {sentido.destino}
                      </h3>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        bate ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {bate ? "✅" : "⚠️"} {totalCapturado} capturados
                        {totalInformado !== null && ` / ${totalInformado} informados`}
                      </span>
                    </div>

                    {/* Tabela de horários */}
                    <div className="overflow-x-auto rounded-xl border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50 text-xs text-gray-500">
                            <th className="px-4 py-2.5 text-left font-medium w-8">#</th>
                            <th className="px-4 py-2.5 text-left font-medium">Horário</th>
                            <th className="px-4 py-2.5 text-left font-medium">Tipo de saída</th>
                            <th className="px-4 py-2.5 text-left font-medium">Observação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {horarios.map((h, i) => (
                            <tr key={`${h.horario}-${i}`} className="hover:bg-gray-50">
                              <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                              <td className="px-4 py-2.5">
                                <span className="font-mono text-base font-bold text-gray-900">
                                  {h.horario}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                {h.tipo === "intermediario" ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                    Ponto intermediário
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                    Rodoviária
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-400 max-w-xs truncate" title={h.observacao}>
                                {h.observacao}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t bg-gray-50">
                            <td colSpan={4} className="px-4 py-2 text-xs text-gray-500">
                              <span className="mr-4">
                                🔵 Rodoviária: {horarios.filter(h => h.tipo === "rodoviaria").length}
                              </span>
                              <span>
                                🟡 Ponto intermediário: {horarios.filter(h => h.tipo === "intermediario").length}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Pontos de parada */}
                    {sentido.pontosDeParada.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="text-xs font-medium text-gray-500">Pontos de parada:</span>
                        {sentido.pontosDeParada.map((p) => (
                          <span key={p} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
                            📍 {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Texto bruto (debug) */}
            <div className="border-t px-6 py-4">
              <button
                onClick={() => setTextoVisivel((v) => !v)}
                className="text-xs text-gray-400 underline hover:text-gray-600"
              >
                {textoVisivel ? "▲ Ocultar" : "▼ Ver"} texto bruto extraído
              </button>
              {textoVisivel && (
                <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-gray-900 p-4 text-xs text-green-300 whitespace-pre-wrap">
                  {consultaSelecionada.textoVisivel || "(vazio)"}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Resumo de todas as consultas carregadas */}
        {consultas.length > 0 && !consultaSelecionada && (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
            <div className="border-b px-6 py-4">
              <h2 className="font-bold text-gray-900">
                📋 {consultas.length} rotas encontradas — selecione uma acima para ver detalhes
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-xs text-gray-500">
                    <th className="px-4 py-3 text-left font-medium">Rota</th>
                    <th className="px-4 py-3 text-left font-medium">Linha</th>
                    <th className="px-4 py-3 text-left font-medium">Tarifas</th>
                    <th className="px-4 py-3 text-left font-medium">Sentidos</th>
                    <th className="px-4 py-3 text-left font-medium">Total horários</th>
                    <th className="px-4 py-3 text-left font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {consultas.map((c) => (
                    <tr key={`${c.origemSelecionada}-${c.destinoSelecionado}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {c.origemSelecionada} → {c.destinoSelecionado}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{c.linha ?? "—"}</td>
                      <td className="px-4 py-3">
                        {c.tarifas.map((t) => (
                          <span key={t.tipo} className="mr-2 text-xs text-gray-600">
                            {t.tipo}: <strong>{t.valor}</strong>
                          </span>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{c.sentidos.length}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {c.sentidos.reduce((acc, s) => acc + s.horarios.length, 0)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setOrigem(c.origemSelecionada);
                            setDestino(c.destinoSelecionado);
                            setConsultaSelecionada(c);
                            setDiaAtivo(c.sentidos[0]?.diaDaSemana ?? "");
                          }}
                          className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Ver detalhes
                        </button>
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
//So para commit denovo