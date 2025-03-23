import React, { useState, useEffect } from "react";

interface Horario {
  id: string;
  origem: string;
  destino: string;
  diaDaSemana: string;
  horario: string;
  tarifa?: string;
  observacao?: string;
}

const HorarioTable: React.FC<{ horarios: Horario[] }> = ({ horarios }) => {
  const [sortedHorarios, setSortedHorarios] = useState<Horario[]>([]);
  const [sortColumn, setSortColumn] = useState<keyof Horario>("origem");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    origem: "",
    destino: "",
    diaDaSemana: "",
  });

  useEffect(() => {
    let sortedData = [...horarios];

    // Ordenação inicial por origem, destino, diaDaSemana e horário
    sortedData.sort((a, b) => {
      const order = ["origem", "destino", "diaDaSemana", "horario"];
      for (let key of order) {
        const valueA = a[key as keyof Horario] || "";
        const valueB = b[key as keyof Horario] || "";
        if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
        if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });

    // Aplicando filtros
    sortedData = sortedData.filter((horario) =>
      Object.keys(filters).every((key) =>
        filters[key as keyof typeof filters]
          ? horario[key as keyof Horario]
              ?.toLowerCase()
              .includes(filters[key as keyof typeof filters].toLowerCase())
          : true
      )
    );

    setSortedHorarios(sortedData);
  }, [horarios, sortColumn, sortDirection, filters]);

  const handleSort = (column: keyof Horario) => {
    setSortColumn(column);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>, column: keyof typeof filters) => {
    setFilters((prev) => ({
      ...prev,
      [column]: e.target.value,
    }));
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-2 p-2">
        <input
          type="text"
          placeholder="Filtrar por origem"
          className="border p-2 rounded"
          value={filters.origem}
          onChange={(e) => handleFilterChange(e, "origem")}
        />
        <input
          type="text"
          placeholder="Filtrar por destino"
          className="border p-2 rounded"
          value={filters.destino}
          onChange={(e) => handleFilterChange(e, "destino")}
        />
        <input
          type="text"
          placeholder="Filtrar por dia da semana"
          className="border p-2 rounded"
          value={filters.diaDaSemana}
          onChange={(e) => handleFilterChange(e, "diaDaSemana")}
        />
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            {["Origem", "Destino", "Dia da Semana", "Horário", "Tarifa", "Observação"].map((col, index) => (
              <th
                key={index}
                className="border border-gray-300 px-4 py-2 cursor-pointer"
                onClick={() => handleSort(col.toLowerCase() as keyof Horario)}
              >
                {col} {sortColumn === col.toLowerCase() ? (sortDirection === "asc" ? "⬆️" : "⬇️") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedHorarios.map((horario) => (
            <tr key={horario.id} className="hover:bg-gray-100">
              <td className="border border-gray-300 px-4 py-2">{horario.origem}</td>
              <td className="border border-gray-300 px-4 py-2">{horario.destino}</td>
              <td className="border border-gray-300 px-4 py-2">{horario.diaDaSemana}</td>
              <td className="border border-gray-300 px-4 py-2">{horario.horario}</td>
              <td className="border border-gray-300 px-4 py-2">{horario.tarifa || "N/A"}</td>
              <td className="border border-gray-300 px-4 py-2">{horario.observacao || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HorarioTable;
