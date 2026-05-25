import { GetStaticProps } from "next";
import { useState } from "react";
import path from "path";
import fs from "fs";

type RotasJson = {
  mapa: Record<string, string[]>;
  todas_cidades: string[];
  gerado_em: string;
};

type Props = {
  rotas: RotasJson;
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const jsonPath = path.join(process.cwd(), "public", "rotas-saobento.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const rotas: RotasJson = JSON.parse(raw);
  return { props: { rotas } };
};

export default function TesteSemiurbanoPage({ rotas }: Props) {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");

  const destinosDisponiveis = origem ? (rotas.mapa[origem] ?? []) : [];

  function handleOrigem(nova: string) {
    setOrigem(nova);
    setDestino(""); // limpa destino ao trocar origem
  }

  function handleSwap() {
    if (!origem || !destino) return;
    // Verifica se a troca é válida (destino atual tem origem atual como destino)
    const novaOrigem = destino;
    const novoDestino = origem;
    const destinosDeNova = rotas.mapa[novaOrigem] ?? [];
    setOrigem(novaOrigem);
    setDestino(destinosDeNova.includes(novoDestino) ? novoDestino : "");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Teste de dropdowns dinâmicos
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            🚌 Semiurbano São Bento
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {rotas.todas_cidades.length} cidades · {Object.values(rotas.mapa).reduce((a, b) => a + b.length, 0)} combinações
            · atualizado em {new Date(rotas.gerado_em).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Seletores */}
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

            {/* Origem */}
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                📍 Origem — De onde você está saindo?
              </label>
              <select
                value={origem}
                onChange={(e) => handleOrigem(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none hover:border-gray-300"
              >
                <option value="">Selecione a origem...</option>
                {rotas.todas_cidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Botão swap */}
            <button
              onClick={handleSwap}
              disabled={!origem || !destino}
              title="Inverter origem e destino"
              className="shrink-0 self-center rounded-full border-2 border-blue-200 bg-white p-2.5 text-blue-600 transition-all hover:border-blue-400 hover:bg-blue-50 disabled:opacity-30 sm:mb-0.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 3L4 7l4 4M4 7h16m4 10l-4 4-4-4m4-4H4" />
              </svg>
            </button>

            {/* Destino */}
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                📍 Destino — Pra onde você vai?
              </label>
              <select
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                disabled={!origem}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">
                  {origem ? "Selecione o destino..." : "Selecione a origem primeiro"}
                </option>
                {destinosDisponiveis.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Feedback da seleção */}
          {origem && destino && (
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <span className="text-blue-600 text-lg">✅</span>
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  {origem} → {destino}
                </p>
                <p className="text-xs text-blue-600">
                  Rota selecionada — pronto para buscar horários
                </p>
              </div>
            </div>
          )}

          {origem && !destino && destinosDisponiveis.length > 0 && (
            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-2">
                {destinosDisponiveis.length} destinos disponíveis a partir de <strong>{origem}</strong>:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {destinosDisponiveis.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDestino(c)}
                    className="rounded-full bg-white border border-gray-200 px-2.5 py-0.5 text-xs text-gray-700 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mapa completo de rotas */}
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h2 className="font-bold text-gray-900">🗺 Mapa completo de rotas</h2>
            <p className="text-xs text-gray-500 mt-0.5">Todas as combinações disponíveis no site</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs text-gray-500">
                  <th className="px-4 py-3 text-left font-medium">Origem</th>
                  <th className="px-4 py-3 text-left font-medium">Destinos disponíveis</th>
                  <th className="px-4 py-3 text-left font-medium w-16">Qtd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rotas.todas_cidades.map((cidade) => {
                  const destinos = rotas.mapa[cidade] ?? [];
                  const isOrigem = cidade === origem;
                  return (
                    <tr
                      key={cidade}
                      className={`cursor-pointer transition-colors hover:bg-blue-50 ${isOrigem ? "bg-blue-50" : ""}`}
                      onClick={() => handleOrigem(cidade)}
                    >
                      <td className={`px-4 py-3 font-medium whitespace-nowrap ${isOrigem ? "text-blue-700" : "text-gray-900"}`}>
                        {isOrigem && <span className="mr-1">▶</span>}
                        {cidade}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {destinos.map((d) => (
                            <span
                              key={d}
                              onClick={(e) => { e.stopPropagation(); if (isOrigem) setDestino(d); }}
                              className={`rounded-full px-2 py-0.5 text-xs transition-colors ${
                                isOrigem
                                  ? d === destino
                                    ? "bg-blue-600 text-white cursor-pointer"
                                    : "bg-blue-100 text-blue-700 cursor-pointer hover:bg-blue-200"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{destinos.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}
