import { useMemo, useState } from "react";

type DiaResumo = {
  dia: string;
  totalHorarios: number;
  primeiroHorario: string;
  ultimoHorario: string;
};

type RotaResumo = {
  origem: string;
  destino: string;
  linha: string;
  tarifaComum: string;
  tarifaEstudante: string;
  observacaoTarifa: string;
  dias: DiaResumo[];
};

const ROTAS: RotaResumo[] = [
  {
    origem: "Brodowski",
    destino: "Ribeirão Preto",
    linha: "Ribeirão Preto X Brodowski",
    tarifaComum: "R$ 8,95",
    tarifaEstudante: "R$ 4,47",
    observacaoTarifa: "Semiurbanos funcionam com cartões VSB CARD.",
    dias: [
      { dia: "Segunda a Sexta", totalHorarios: 15, primeiroHorario: "05:00", ultimoHorario: "20:30" },
      { dia: "Sábado", totalHorarios: 10, primeiroHorario: "05:00", ultimoHorario: "21:00" },
      { dia: "Domingo", totalHorarios: 11, primeiroHorario: "06:00", ultimoHorario: "22:30" },
    ],
  },
  {
    origem: "Ribeirão Preto",
    destino: "Brodowski",
    linha: "Ribeirão Preto X Brodowski",
    tarifaComum: "R$ 8,95",
    tarifaEstudante: "R$ 4,47",
    observacaoTarifa: "Semiurbanos funcionam com cartões VSB CARD.",
    dias: [
      { dia: "Segunda a Sexta", totalHorarios: 15, primeiroHorario: "05:00", ultimoHorario: "20:30" },
      { dia: "Sábado", totalHorarios: 10, primeiroHorario: "05:00", ultimoHorario: "21:00" },
      { dia: "Domingo", totalHorarios: 11, primeiroHorario: "06:00", ultimoHorario: "22:30" },
    ],
  },
];

export default function SemiurbanoResumoTabela() {
  const [origem, setOrigem] = useState("Brodowski");
  const [destino, setDestino] = useState("Ribeirão Preto");

  const cidades = useMemo(() => Array.from(new Set(ROTAS.flatMap((rota) => [rota.origem, rota.destino]))).sort(), []);

  const resumoSelecionado = useMemo(
    () => ROTAS.find((rota) => rota.origem === origem && rota.destino === destino),
    [origem, destino],
  );

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">Consulta rápida por origem e destino</h2>
      <p className="mt-2 text-sm text-slate-300">
        Selecione uma cidade de origem e outra de destino para ver as principais informações resumidas da página semiurbana.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-200">Origem</span>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={origem}
            onChange={(event) => setOrigem(event.target.value)}
          >
            {cidades.map((cidade) => (
              <option key={`origem-${cidade}`} value={cidade}>{cidade}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-200">Destino</span>
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
            value={destino}
            onChange={(event) => setDestino(event.target.value)}
          >
            {cidades.map((cidade) => (
              <option key={`destino-${cidade}`} value={cidade}>{cidade}</option>
            ))}
          </select>
        </label>
      </div>

      {!resumoSelecionado ? (
        <p className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100">
          Não há resumo disponível para a combinação selecionada.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse overflow-hidden rounded-xl border border-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Rota</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Dia</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Total</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Primeiro</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Último</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Comum/VT</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Estudante</th>
              </tr>
            </thead>
            <tbody>
              {resumoSelecionado.dias.map((dia) => (
                <tr key={dia.dia} className="border-t border-slate-700 bg-slate-950">
                  <td className="px-3 py-2 text-sm">{resumoSelecionado.origem} → {resumoSelecionado.destino}</td>
                  <td className="px-3 py-2 text-sm">{dia.dia}</td>
                  <td className="px-3 py-2 text-sm">{dia.totalHorarios}</td>
                  <td className="px-3 py-2 text-sm">{dia.primeiroHorario}</td>
                  <td className="px-3 py-2 text-sm">{dia.ultimoHorario}</td>
                  <td className="px-3 py-2 text-sm">{resumoSelecionado.tarifaComum}</td>
                  <td className="px-3 py-2 text-sm">{resumoSelecionado.tarifaEstudante}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-400">{resumoSelecionado.observacaoTarifa}</p>
        </div>
      )}
    </section>
  );
}