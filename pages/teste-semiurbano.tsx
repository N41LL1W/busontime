import { useState } from "react";

type TesteHorario = {
  horario: string;
  tipo: "rodoviaria" | "intermediario";
  observacao: string;
};

type TesteSentido = {
  diaDaSemana: string;
  origem: string;
  destino: string;
  totalInformado: number | null;
  horarios: TesteHorario[];
  pontosDeParada: string[];
};

type TesteResultado = {
  ok: true;
  sourceUrl: string;
  pesquisadoEm: string;
  origemSelecionada: string;
  destinoSelecionado: string;
  linha: string | null;
  tarifas: Array<{ tipo: string; valor: string }>;
  sentidos: TesteSentido[];
  textoVisivel: string;
};

type TesteErro = {
  ok: false;
  error: string;
};

type TesteResponse = TesteResultado | TesteErro;

export default function TesteSemiurbanoPage() {
  const [resultado, setResultado] = useState<TesteResultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function iniciarTeste() {
    setCarregando(true);
    setErro(null);
    setResultado(null);

    try {
      const response = await fetch("/api/teste-semiurbano", { method: "POST" });
      const data = (await response.json()) as TesteResponse;

      if ("error" in data) {
        throw new Error(data.error);
      }

      if (!response.ok) {
        throw new Error("Erro inesperado no teste.");
      }

      setResultado(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro desconhecido ao iniciar teste.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Teste de raspagem</p>
          <h1 className="mt-2 text-3xl font-bold">Semiurbano: teste automático de rota</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Esta página não grava no banco. Ela abre o site novo, procura opções de cidade nos seletores de <strong>origem</strong> e <strong>destino</strong>, escolhe automaticamente, consulta os horários, clica em <strong>Ver horários de volta</strong> e mostra tudo que foi encontrado na tela.
          </p>

          <button
            className="mt-6 rounded-lg bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={carregando}
            onClick={iniciarTeste}
            type="button"
          >
            {carregando ? "Rodando automação..." : "Startar teste de raspagem"}
          </button>
        </section>

        {erro && (
          <section className="rounded-2xl border border-red-500/40 bg-red-950/50 p-5 text-red-100">
            <h2 className="text-xl font-bold">Falhou</h2>
            <p className="mt-2">{erro}</p>
          </section>
        )}

        {resultado && (
          <section className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-wrap items-start gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold">Resultado encontrado</h2>
                <p className="text-sm text-slate-400">Fonte: {resultado.sourceUrl}</p>
                <p className="text-sm text-slate-400">
                  Consulta: {resultado.origemSelecionada} → {resultado.destinoSelecionado}
                </p>
              </div>
              <div className="ml-auto rounded-xl bg-slate-800 px-4 py-3 text-sm text-slate-200">
                {new Date(resultado.pesquisadoEm).toLocaleString("pt-BR")}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="font-bold text-cyan-300">Linha e tarifas</h3>
              <p className="mt-2 text-lg font-semibold">{resultado.linha ?? "Linha não encontrada"}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {resultado.tarifas.length > 0 ? (
                  resultado.tarifas.map((tarifa) => (
                    <span key={`${tarifa.tipo}-${tarifa.valor}`} className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-100">
                      {tarifa.tipo}: <strong>{tarifa.valor}</strong>
                    </span>
                  ))
                ) : (
                  <span className="text-slate-400">Nenhuma tarifa encontrada.</span>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {resultado.sentidos.length > 0 ? (
                resultado.sentidos.map((sentido) => (
                  <article
                    key={`${sentido.diaDaSemana}-${sentido.origem}-${sentido.destino}`}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div className="border-b border-slate-800 pb-3">
                      <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">{sentido.diaDaSemana}</p>
                      <h3 className="mt-1 text-xl font-bold">
                        {sentido.origem} → {sentido.destino}
                      </h3>
                      <p className="text-sm text-slate-400">
                        {sentido.totalInformado ?? sentido.horarios.length} horários informados / {sentido.horarios.length} capturados
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {sentido.horarios.map((item) => (
                        <span
                          key={`${item.horario}-${item.tipo}`}
                          className={
                            item.tipo === "intermediario"
                              ? "rounded-md bg-amber-300 px-3 py-1.5 text-sm font-bold text-amber-950"
                              : "rounded-md bg-cyan-400/15 px-3 py-1.5 text-sm font-bold text-cyan-100"
                          }
                          title={item.observacao}
                        >
                          {item.horario}
                        </span>
                      ))}
                    </div>

                    {sentido.pontosDeParada.length > 0 && (
                      <div className="mt-4 border-t border-slate-800 pt-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pontos de parada</p>
                        <ul className="mt-2 list-inside list-disc text-sm text-slate-300">
                          {sentido.pontosDeParada.map((ponto) => (
                            <li key={ponto}>{ponto}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))
              ) : (
                <p className="rounded-xl border border-amber-400/40 bg-amber-950/40 p-4 text-amber-100 md:col-span-2">
                  Nenhum bloco de horários foi capturado. Confira o texto bruto abaixo.
                </p>
              )}
            </div>

            <details className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <summary className="cursor-pointer font-bold text-slate-200">Ver texto bruto capturado da página</summary>
              <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap text-xs text-slate-300">{resultado.textoVisivel}</pre>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}