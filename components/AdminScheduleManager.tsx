import React, { useEffect, useMemo, useState } from 'react';

type Horario = {
  id: number;
  origem: string;
  destino: string;
  diaDaSemana: string;
  horario: string;
  tarifa?: number | null;
  observacao?: string | null;
};

type FormState = {
  id?: number;
  origem: string;
  destino: string;
  diaDaSemana: string;
  horario: string;
  tarifa: string;
  observacao: string;
};

const emptyForm: FormState = {
  origem: '',
  destino: '',
  diaDaSemana: 'Segunda a Sexta',
  horario: '',
  tarifa: '',
  observacao: '',
};

const diasDaSemana = [
  'Segunda a Sexta',
  'Sábado',
  'Domingo',
  'Todos os dias',
  'Feriado',
];

export default function AdminScheduleManager() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [status, setStatus] = useState('Carregando horários...');
  const [isSaving, setIsSaving] = useState(false);

  const fetchHorarios = async () => {
    setStatus('Carregando horários...');
    const response = await fetch('/api/horarios');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || 'Erro ao carregar horários.');
    }

    setHorarios(data);
    setStatus(`${data.length} horários carregados.`);
  };

  useEffect(() => {
    fetchHorarios().catch((error) => setStatus(error.message));
  }, []);

  const routes = useMemo(() => {
    return Array.from(new Set(horarios.map((item) => `${item.origem} → ${item.destino}`))).sort((a, b) => a.localeCompare(b));
  }, [horarios]);

  const filteredHorarios = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return horarios.filter((item) => {
      const route = `${item.origem} → ${item.destino}`;
      const matchesRoute = routeFilter ? route === routeFilter : true;
      const matchesSearch = normalizedSearch
        ? [item.origem, item.destino, item.diaDaSemana, item.horario, item.observacao || '']
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch)
        : true;

      return matchesRoute && matchesSearch;
    });
  }, [horarios, routeFilter, search]);

  const updateForm = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const editHorario = (horario: Horario) => {
    setForm({
      id: horario.id,
      origem: horario.origem,
      destino: horario.destino,
      diaDaSemana: horario.diaDaSemana,
      horario: horario.horario,
      tarifa: horario.tarifa === null || horario.tarifa === undefined ? '' : String(horario.tarifa).replace('.', ','),
      observacao: horario.observacao || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearForm = () => {
    setForm(emptyForm);
    setStatus('Formulário limpo.');
  };

  const saveHorario = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setStatus(form.id ? 'Salvando alteração...' : 'Cadastrando horário...');

    try {
      const response = await fetch('/api/horarios', {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Erro ao salvar horário.');
      }

      await fetchHorarios();
      setForm(emptyForm);
      setStatus(data.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Erro ao salvar horário.');
    } finally {
      setIsSaving(false);
    }
  };

  const removeHorario = async (id: number) => {
    if (!confirm('Remover este horário do sistema?')) return;

    setStatus('Removendo horário...');
    const response = await fetch(`/api/horarios?id=${id}`, { method: 'DELETE' });
    const data = await response.json();

    if (!response.ok) {
      setStatus(data?.message || 'Erro ao remover horário.');
      return;
    }

    await fetchHorarios();
    setStatus(data.message);
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Configuração manual</p>
          <h2 className="text-2xl font-bold">Cadastrar ou corrigir horário</h2>
          <p className="text-sm text-muted-foreground">
            Use esta área quando o horário puxado do Semiurbano/VSB não bater com o site oficial. A alteração salva aqui já fica disponível para o sistema consultar pelo banco.
          </p>
        </div>

        <form onSubmit={saveHorario} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 text-sm font-medium">
            Origem
            <input className="w-full rounded border p-2 text-foreground" value={form.origem} onChange={(event) => updateForm('origem', event.target.value)} placeholder="Ex.: Ribeirão Preto" required />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Destino
            <input className="w-full rounded border p-2 text-foreground" value={form.destino} onChange={(event) => updateForm('destino', event.target.value)} placeholder="Ex.: Sertãozinho" required />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Dia da semana
            <input className="w-full rounded border p-2 text-foreground" list="diasDaSemana" value={form.diaDaSemana} onChange={(event) => updateForm('diaDaSemana', event.target.value)} required />
            <datalist id="diasDaSemana">
              {diasDaSemana.map((dia) => <option key={dia} value={dia} />)}
            </datalist>
          </label>
          <label className="space-y-1 text-sm font-medium">
            Horário
            <input className="w-full rounded border p-2 text-foreground" value={form.horario} onChange={(event) => updateForm('horario', event.target.value)} placeholder="HH:mm" required />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Tarifa (opcional)
            <input className="w-full rounded border p-2 text-foreground" value={form.tarifa} onChange={(event) => updateForm('tarifa', event.target.value)} placeholder="Ex.: 8,50" />
          </label>
          <label className="space-y-1 text-sm font-medium lg:col-span-1">
            Observação
            <input className="w-full rounded border p-2 text-foreground" value={form.observacao} onChange={(event) => updateForm('observacao', event.target.value)} placeholder="Ex.: passa pela rodoviária" />
          </label>

          <div className="flex flex-wrap items-end gap-2 md:col-span-2 lg:col-span-3">
            <button type="submit" disabled={isSaving} className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400">
              {isSaving ? 'Salvando...' : form.id ? 'Salvar alteração' : 'Cadastrar horário'}
            </button>
            {form.id && (
              <button type="button" onClick={clearForm} className="rounded border px-4 py-2 font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800">
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Conferência</p>
            <h2 className="text-2xl font-bold">Horários cadastrados</h2>
            <p className="text-sm text-muted-foreground">{status}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input className="rounded border p-2 text-foreground" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cidade, dia ou horário" />
            <select className="rounded border p-2 text-foreground" value={routeFilter} onChange={(event) => setRouteFilter(event.target.value)}>
              <option value="">Todas as rotas</option>
              {routes.map((route) => <option key={route} value={route}>{route}</option>)}
            </select>
            <button type="button" onClick={() => fetchHorarios().catch((error) => setStatus(error.message))} className="rounded border px-4 py-2 font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800">
              Recarregar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-left dark:bg-zinc-800">
                <th className="border p-2">Origem</th>
                <th className="border p-2">Destino</th>
                <th className="border p-2">Dia</th>
                <th className="border p-2">Horário</th>
                <th className="border p-2">Tarifa</th>
                <th className="border p-2">Observação</th>
                <th className="border p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredHorarios.map((horario) => (
                <tr key={horario.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800">
                  <td className="border p-2">{horario.origem}</td>
                  <td className="border p-2">{horario.destino}</td>
                  <td className="border p-2">{horario.diaDaSemana}</td>
                  <td className="border p-2 font-semibold">{horario.horario}</td>
                  <td className="border p-2">{horario.tarifa === null || horario.tarifa === undefined ? '-' : `R$ ${Number(horario.tarifa).toFixed(2).replace('.', ',')}`}</td>
                  <td className="border p-2">{horario.observacao || '-'}</td>
                  <td className="border p-2">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => editHorario(horario)} className="rounded bg-amber-500 px-3 py-1 font-semibold text-white hover:bg-amber-600">Editar</button>
                      <button type="button" onClick={() => removeHorario(horario.id)} className="rounded bg-red-600 px-3 py-1 font-semibold text-white hover:bg-red-700">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredHorarios.length === 0 && (
                <tr>
                  <td className="border p-6 text-center text-muted-foreground" colSpan={7}>Nenhum horário encontrado com os filtros atuais.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
