import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import HorarioTable from "./HorarioTable";

const fetchHorarios = async () => {
  const response = await fetch("/api/horarios");
  if (!response.ok) throw new Error("Erro ao buscar horários");
  return response.json();
};


const HorariosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: horarios = [], isLoading: isFetching } = useQuery({
    queryKey: ["horarios"],
    queryFn: fetchHorarios,
  });

  useEffect(() => {
    const refresh = () => queryClient.invalidateQueries({ queryKey: ["horarios"] });
    window.addEventListener("busontime:refresh-horarios", refresh);
    return () => window.removeEventListener("busontime:refresh-horarios", refresh);
  }, [queryClient]);

  const totalItems = horarios.length;
  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(totalItems / itemsPerPage);

  const paginatedHorarios =
    itemsPerPage === 0
      ? horarios
      : horarios.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const generatePagination = () => {
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === 2 ||
        i === totalPages ||
        i === totalPages - 1 ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }

    return pages;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Horários de Transporte Suburbano</h1>

      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm">
        <div>
          <p className="font-semibold text-gray-950">Tabela de horários cadastrados</p>
          <p className="text-sm text-muted-foreground">Use os controles acima para raspar dados e depois atualize esta listagem.</p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ["horarios"] })}
          disabled={isFetching}
          className="rounded-xl bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:bg-gray-400"
        >
          {isFetching ? "Atualizando..." : "Recarregar tabela"}
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label htmlFor="itemsPerPage">Itens por página:</label>
        <select
          id="itemsPerPage"
          className="border p-1 rounded"
          value={itemsPerPage}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            setItemsPerPage(value);
            setCurrentPage(1);
          }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={0}>Mostrar tudo</option>
        </select>
      </div>

      {paginatedHorarios && paginatedHorarios.length > 0 ? (
        <>
          <HorarioTable horarios={paginatedHorarios} />
          {itemsPerPage !== 0 && totalPages > 1 && (
            <div className="mt-4 flex justify-center gap-2 flex-wrap">
              {generatePagination().map((page, idx) =>
                page === "..." ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-1">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    className={`px-3 py-1 rounded border ${
                      page === currentPage ? "bg-blue-500 text-white" : "bg-white"
                    }`}
                    onClick={() => setCurrentPage(Number(page))}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          )}
        </>
      ) : (
        <p>{isFetching ? "Carregando horários..." : "Nenhum horário encontrado."}</p>
      )}
    </div>
  );
};

export default HorariosPage;
