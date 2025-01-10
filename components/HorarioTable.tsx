import React from 'react';

type Horario = {
  id: number;
  origem: string;
  destino: string;
  horario: string;
  diaDaSemana: string;
  observacao?: string | null;
};

type Props = {
  horarios: Horario[];
};

const HorarioTable: React.FC<Props> = ({ horarios }) => {
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr>
          <th className="border border-gray-300 p-2">Origem</th>
          <th className="border border-gray-300 p-2">Destino</th>
          <th className="border border-gray-300 p-2">Horário</th>
          <th className="border border-gray-300 p-2">Dia da Semana</th>
          <th className="border border-gray-300 p-2">Observação</th>
        </tr>
      </thead>
      <tbody>
        {horarios.map((horario) => (
          <tr key={horario.id}>
            <td className="border border-gray-300 p-2">{horario.origem}</td>
            <td className="border border-gray-300 p-2">{horario.destino}</td>
            <td className="border border-gray-300 p-2">{horario.horario}</td>
            <td className="border border-gray-300 p-2">{horario.diaDaSemana}</td>
            <td className="border border-gray-300 p-2">{horario.observacao || '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default HorarioTable;
