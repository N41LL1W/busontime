import { useEffect, useMemo, useState } from "react";

type HorarioApi = {
  origem: string;
  destino: string;
  diaDaSemana: string;
  horario: string;
  tarifa?: number | null;
};

type DiaResumo = {
  dia: string;
  totalHorarios: number;
  primeiroHorario: string;
  ultimoHorario: string;
};

type RotaResumo = {
  origem: string;
  destino: string;
  tarifaComum: string;
  dias: DiaResumo[];
};

const DIA_GRUPO_LABEL: Record<string, string> = {
  weekday: "Segunda a Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const getDiaGrupo = (dia: string) => {
  const normalizado = dia.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalizado.includes("sab")) return "saturday";
  if (normalizado.includes("dom") || normalizado.includes("feriado")) return "sunday";
  return "weekday";
};

const formatTarifa = (tarifa: number | null) => {
  if (typeof tarifa !== "number" || Number.isNaN(tarifa)) return "Não informado";
  return tarifa.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export default function SemiurbanoResumoTabela() {
  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [horarios, setHorarios] = useState<HorarioApi[]>([]);
  const [loading, setLoading] = useState(true);
    useEffect(() => {
    const carregar = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/horarios");
        const data: HorarioApi[] = await response.json();
        setHorarios(Array.isArray(data) ? data : []);
      } catch {
        setHorarios([]);
      } finally {
        setLoading(false);
      }
    };

    void carregar();
  }, []);

  const cidades = useMemo(() => {
    const set = new Set<string>();
    horarios.forEach((item) => {
      set.add(item.origem);
      set.add(item.destino);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [horarios]);

  useEffect(() => {
    if (!cidades.length) return;
    if (!origem || !cidades.includes(origem)) setOrigem(cidades[0]);
    if (!destino || !cidades.includes(destino)) setDestino(cidades[1] ?? cidades[0]);
  }, [cidades, origem, destino]);

  const resumoSelecionado = useMemo<RotaResumo | null>(() => {
    if (!origem || !destino) return null;

    const selecionados = horarios.filter((item) => item.origem === origem && item.destino === destino);
    if (!selecionados.length) return null;

    const porGrupo = new Map<string, string[]>();
    const tarifas = selecionados.map((item) => item.tarifa).filter((value): value is number => typeof value === "number");

    selecionados.forEach((item) => {
      const grupo = getDiaGrupo(item.diaDaSemana);
      const atual = porGrupo.get(grupo) ?? [];
      atual.push(item.horario);
      porGrupo.set(grupo, atual);
    });

    const dias: DiaResumo[] = ["weekday", "saturday", "sunday"]
      .filter((grupo) => porGrupo.has(grupo))
      .map((grupo) => {
        const lista = [...(porGrupo.get(grupo) ?? [])].sort((a, b) => a.localeCompare(b));
        return {
          dia: DIA_GRUPO_LABEL[grupo],
          totalHorarios: lista.length,
          primeiroHorario: lista[0],
          ultimoHorario: lista[lista.length - 1],
        };
      });

    return {
      origem,
      destino,
      tarifaComum: formatTarifa(tarifas[0] ?? null),
      dias,
    };
  }, [origem, destino, horarios]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-2xl font-bold">Consulta rápida por origem e destino</h2>
      <p className="mt-2 text-sm text-slate-300">Selecione a origem e o destino para ver o resumo dos itinerários cadastrados.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-200">Origem</span>
          <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={origem} onChange={(event) => setOrigem(event.target.value)}>
            {cidades.map((cidade) => (
              <option key={`origem-${cidade}`} value={cidade}>{cidade}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-slate-200">Destino</span>
          <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" value={destino} onChange={(event) => setDestino(event.target.value)}>
            {cidades.map((cidade) => (
              <option key={`destino-${cidade}`} value={cidade}>{cidade}</option>
            ))}
          </select>
        </label>
      </div>

      {loading ? <p className="mt-5 text-sm text-slate-300">Carregando dados...</p> : null}

      {!loading && !resumoSelecionado ? (
        <p className="mt-5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-100">Não há resumo disponível para a combinação selecionada.</p>
      ) : null}

      {resumoSelecionado ? (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-collapse overflow-hidden rounded-xl border border-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Rota</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Dia</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Total</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Primeiro</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Último</th>
                <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wide">Tarifa</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        ) : null}
    </section>
  );
}