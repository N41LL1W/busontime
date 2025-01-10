import React from 'react';
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

  const { data: horarios, isLoading: isFetching } = useQuery({
    queryKey: ['horarios'],
    queryFn: fetchHorarios,
  });

  const mutation = useMutation({
    mutationFn: updateHorarios,
    onSuccess: () => {
      // Atualiza a lista de horários após a raspagem
      queryClient.invalidateQueries({ queryKey: ['horarios'] });
    },
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Horários de Transporte Suburbano</h1>
      <div className="mb-4">
        <UpdateButton
          onClick={() => mutation.mutate()}
          isLoading={mutation.status === 'pending' || isFetching}
        />
      </div>
      {Array.isArray(horarios) && horarios.length > 0 ? (
        <HorarioTable horarios={horarios} />
      ) : (
        <p>Carregando horários...</p>
      )}
    </div>
  );
};

export default HorariosPage;
