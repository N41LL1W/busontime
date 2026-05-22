import { GetStaticProps } from "next";
import { useState } from "react";
import path from "path";
import fs from "fs";

// ── Tipos ────────────────────────────────────────────────────────────────
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

type DadosJson = {
  origem: string;
  destino: string;
  linha: string;
  tarifas: Array<{ tipo: string; valor: string }>;
  sentidos: Sentido[];
  cidades_disponiveis: string[];
  pesquisado_em: string;
};

type Props = {
  dados: DadosJson | null;
  erro: string | null;
};

const ORDEM_DIAS = ["Segunda a Sexta", "Sábado", "Domingo e Feriados"];

// ── getStaticProps: lê o JSON em build time ───────────────────────────────
export const getStaticProps: GetStaticProps<Props> = async () => {
  const jsonPath = path.join(process.cwd(), "public", "horarios-saobento.json");

  try {
    const raw = fs.readFileSync(jsonPath, "utf-8");
    const dados: DadosJson = JSON.parse(raw);
    return { props: { dados, erro: null } };
  } catch {
    return { props: { dados: null, erro: "Arquivo public/horarios-saobento.json não encontrado. Rode o scraper primeiro." } };
  }
};

// ── Página ────────────────────────────────────────────────────────────────
export default function TesteSemiurbanoPage({ dados, erro }: Props) {
  const dias = dados
    ? [...new Set(dados.sentidos.map((s) => s.diaDaSemana))].sort(
        (a, b) =>
          (ORDEM_DIAS.indexOf(a) === -1 ? 99 : ORDEM_DIAS.indexOf(a)) -
          (ORDEM_DIAS.indexOf(b) === -1 ? 99 : ORDEM_DIAS.indexOf(b))
      )
    : [];

  const [diaAtivo, setDiaAtivo] = useState(dias[0] ?? "");

  const sentidosFiltrados = dados
    ? dados.sentidos.filter((s) => s.diaDaSemana === diaAtivo)
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Teste de raspagem — JSON estático
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            🚌 Semiurbano São Bento
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Lendo <code className="rounded bg-gray-100 px-1">public/horarios-saobento.json</code> gerado pelo scraper Python
          </p>

          {dados && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
              <span>📡 {dados.linha}</span>
              <span>🕐 {new Date(dados.pesquisado_em).toLocaleString("pt-BR")}</span>
              <span>🏙 {dados.cidades_disponiveis.length} cidades disponíveis</span>
            </div>
          )}

          {/* Como atualizar */}
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-400">
            Para atualizar os dados, rode:{" "}
            <code className="rounded bg-gray-100 px-1 text-gray-600">
              .venv\Scripts\python.exe scraper_saobento.py --origem "Brodowski" --destino "Ribeirão Preto"
            </code>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-bold">⚠️ Erro</p>
            <p className="mt-1 text-sm">{erro}</p>
          </div>
        )}

        {/* Dados */}
        {dados && (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">

            {/* Cabeçalho da rota */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b bg-gray-50 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">🚌 {dados.linha}</h2>
                <p className="text-sm text-gray-500">{dados.origem} ↔ {dados.destino}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {dados.tarifas.map((t) => (
                  <span key={t.tipo} className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800">
                    🎫 {t.tipo} <strong>{t.valor}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs de dia */}
            <div className="flex border-b bg-gray-50">
              {dias.map((dia) => (
                <button
                  key={dia}
                  onClick={() => setDiaAtivo(dia)}
                  className={`flex-1 px-3 py-3 text-sm font-medium transition-colors ${
                    diaAtivo === dia
                      ? "border-b-2 border-blue-600 bg-white text-blue-700"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>

            {/* Tabelas por sentido */}
            <div className="divide-y">
              {sentidosFiltrados.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-gray-400">
                  Nenhum horário para este dia.
                </p>
              )}

              {sentidosFiltrados.map((sentido, si) => (
                <div key={si} className="px-6 py-5">
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-gray-800">
                      {sentido.origem} → {sentido.destino}
                    </h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
                      {sentido.horarios.length} horários
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50 text-xs text-gray-500">
                          <th className="px-4 py-2.5 text-left font-medium w-8">#</th>
                          <th className="px-4 py-2.5 text-left font-medium">Horário</th>
                          <th className="px-4 py-2.5 text-left font-medium">Tipo de saída</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sentido.horarios.map((h, hi) => (
                          <tr key={hi} className="hover:bg-gray-50">
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{hi + 1}</td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-lg font-bold text-gray-900">
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
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t bg-gray-50">
                          <td colSpan={3} className="px-4 py-2 text-xs text-gray-400">
                            🔵 Rodoviária: {sentido.horarios.filter((h) => h.tipo === "rodoviaria").length}
                            {" · "}
                            🟡 Intermediário: {sentido.horarios.filter((h) => h.tipo === "intermediario").length}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Cidades disponíveis */}
            <div className="border-t bg-gray-50 px-6 py-4">
              <p className="mb-2 text-xs font-medium text-gray-500">
                Cidades disponíveis no site ({dados.cidades_disponiveis.length}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {dados.cidades_disponiveis.map((c) => (
                  <span key={c} className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs text-gray-600">
                    {c}
                  </span>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
