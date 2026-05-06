import React, { useState, useEffect } from 'react';

interface Horario {
  id: string;
  origem: string;
  destino: string;
  diaDaSemana: string;
  horario: string;
  tarifa?: string | number | null;
  observacao?: string | null;
}

const columns: Array<{ label: string; key: keyof Horario }> = [
  { label: 'Origem', key: 'origem' },
  { label: 'Destino', key: 'destino' },
  { label: 'Dia da Semana', key: 'diaDaSemana' },
  { label: 'Horário', key: 'horario' },
  { label: 'Tarifa', key: 'tarifa' },
  { label: 'Observação', key: 'observacao' },
];

const HorarioTable: React.FC<{ horarios: Horario[] }> = ({ horarios }) => {
  const [sortedHorarios, setSortedHorarios] = useState<Horario[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof Horario>('origem');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({
    origem: '',
    destino: '',
    diaDaSemana: '',
  });

  useEffect(() => {
    let sortedData = [...horarios];

    sortedData.sort((a, b) => {
      const valueA = String(a[sortColumn] || '');
      const valueB = String(b[sortColumn] || '');
      return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    });

    sortedData = sortedData.filter((horario) =>
      Object.keys(filters).every((key) =>
        filters[key as keyof typeof filters]
          ? String(horario[key as keyof Horario] || '')
              .toLowerCase()
              .includes(filters[key as keyof typeof filters].toLowerCase())
          : true
      )
    );

    setSortedHorarios(sortedData);
  }, [horarios, sortColumn, sortDirection, filters]);

  const handleSort = (column: keyof Horario) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      return;
    }

    setSortColumn(column);
    setSortDirection('asc');
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>, column: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [column]: e.target.value,
    }));
  };

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="grid gap-2 border-b bg-muted/30 p-3 md:grid-cols-3">
        <input
          type="text"
          placeholder="Filtrar por origem"
          className="rounded-xl border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          value={filters.origem}
          onChange={(e) => handleFilterChange(e, 'origem')}
        />
        <input
          type="text"
          placeholder="Filtrar por destino"
          className="rounded-xl border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          value={filters.destino}
          onChange={(e) => handleFilterChange(e, 'destino')}
        />
        <input
          type="text"
          placeholder="Filtrar por dia da semana"
          className="rounded-xl border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-emerald-600"
          value={filters.diaDaSemana}
          onChange={(e) => handleFilterChange(e, 'diaDaSemana')}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="bg-muted/70 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="border-b px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label} {sortColumn === col.key ? (sortDirection === 'asc' ? '⬆️' : '⬇️') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedHorarios.map((horario) => (
              <tr key={horario.id} className="border-b last:border-b-0 hover:bg-muted/40">
                <td className="px-4 py-3">{horario.origem}</td>
                <td className="px-4 py-3">{horario.destino}</td>
                <td className="px-4 py-3">{horario.diaDaSemana}</td>
                <td className="px-4 py-3 font-mono font-semibold">{horario.horario}</td>
                <td className="px-4 py-3">{horario.tarifa || 'N/A'}</td>
                <td className="px-4 py-3">{horario.observacao || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HorarioTable;
