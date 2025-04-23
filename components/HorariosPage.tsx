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
  const response = await fetch('/api/scrap', { method: 'POST' });
  if (!response.ok) throw new Error('Erro ao atualizar horários');
  return response.json();
};

const HorariosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const { data: horarios, isLoading: isFetching } = useQuery({
    queryKey: ['horarios'],
    queryFn: fetchHorarios,
  });

  const mutation = useMutation({
    mutationFn: updateHorarios,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
  });

  const totalItems = horarios?.length || 0;
  const totalPages = itemsPerPage === 0 ? 1 : Math.ceil(totalItems / itemsPerPage);

  const paginatedHorarios =
    itemsPerPage === 0
      ? horarios
      : horarios?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Horários de Transporte Suburbano</h1>
      <div className="mb-4">
        <UpdateButton
          onClick={() => mutation.mutate()}
          isLoading={mutation.status === 'pending' || isFetching}
        />
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

      {Array.isArray(horarios) && horarios.length > 0 ? (
        <>
          <HorarioTable horarios={paginatedHorarios || []} />
          {itemsPerPage !== 0 && (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-1 rounded border ${
                    page === currentPage ? 'bg-blue-500 text-white' : 'bg-white'
                  }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <p>Carregando horários...</p>
      )}
    </div>
  );
};

export default HorariosPage;
