import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import HorarioTable from './HorarioTable';
import UpdateButton from './UpdateButton';

const fetchHorarios = async () => {
  const response = await fetch('/api/horarios');
  if (!response.ok) throw new Error('Erro ao buscar horários');
  return response.json();
};

const updateHorarios = async () => {
  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runAll: true }),
  });
  if (!response.ok && response.status !== 207) throw new Error('Erro ao atualizar horários');
  return response.json();
};

const HorariosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: horarios = [], isLoading: isFetching, isError } = useQuery({
    queryKey: ['horarios'],
    queryFn: fetchHorarios,
  });

  const mutation = useMutation({
    mutationFn: updateHorarios,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
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
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return pages;
  };

  return (
    <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Horários cadastrados</h2>
          <p className="text-sm text-muted-foreground">
            {totalItems > 0 ? `${totalItems} registros carregados do banco.` : 'Consulte ou atualize a base de horários.'}
          </p>
        </div>

        <UpdateButton
          onClick={() => mutation.mutate()}
          isLoading={mutation.status === 'pending' || isFetching}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="itemsPerPage" className="font-medium">Itens por página:</label>
        <select
          id="itemsPerPage"
          className="rounded-xl border bg-background px-3 py-2"
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

      {mutation.isError && (
        <p className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Não foi possível atualizar as raspagens agora.
        </p>
      )}

      {isError && (
        <p className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Não foi possível carregar os horários do banco.
        </p>
      )}

      {paginatedHorarios && paginatedHorarios.length > 0 ? (
        <>
          <HorarioTable horarios={paginatedHorarios} />
          {itemsPerPage !== 0 && totalPages > 1 && (
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {generatePagination().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-3 py-2 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    className={`rounded-xl border px-3 py-2 text-sm transition ${
                      page === currentPage ? 'bg-emerald-700 text-white' : 'bg-background hover:bg-muted'
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
        <p className="rounded-2xl border bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
          {isFetching ? 'Carregando horários...' : 'Nenhum horário encontrado.'}
        </p>
      )}
    </section>
  );
};

export default HorariosPage;
