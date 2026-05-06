import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import HorarioTable from "./HorarioTable";
import UpdateButton from "./UpdateButton";

const getResponseError = async (response: Response, fallback: string) => {
  const body = await response.text();
  return body ? `${fallback}: ${body}` : fallback;
};

const fetchHorarios = async () => {
  const response = await fetch("/api/horarios");
  if (!response.ok) {
    throw new Error(await getResponseError(response, "Erro ao buscar horários"));
  }
  return response.json();
};

const updateHorarios = async () => {
  const response = await fetch("/api/scrap", { method: "POST" });
  if (!response.ok) {
    throw new Error(await getResponseError(response, "Erro ao atualizar horários"));
  }
  return response.json();
};

const HorariosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const {
    data: horarios = [],
    error: fetchError,
    isLoading: isFetching,
    isError: hasFetchError,
  } = useQuery({
    queryKey: ["horarios"],
    queryFn: fetchHorarios,
    retry: 1,
  });

  const mutation = useMutation({
    mutationFn: updateHorarios,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["horarios"] });
    },
  });

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

      <div className="mb-4">
        <UpdateButton
          onClick={() => mutation.mutate()}
          isLoading={mutation.status === "pending" || isFetching}
        />
      </div>

      {(hasFetchError || mutation.isError) && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          <p className="font-semibold">Não foi possível carregar os horários.</p>
          {hasFetchError && <p>{fetchError instanceof Error ? fetchError.message : "Erro desconhecido."}</p>}
          {mutation.isError && (
            <p>{mutation.error instanceof Error ? mutation.error.message : "Erro desconhecido ao atualizar."}</p>
          )}
          <p className="mt-2">
            Se esta tela estiver em uma exportação estática ou no app empacotado, as rotas
            <code className="mx-1 rounded bg-red-100 px-1">/api/*</code>
            não ficam disponíveis. Use o servidor Next.js com acesso ao banco para consultar e atualizar os dados.
          </p>
        </div>
      )}

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
