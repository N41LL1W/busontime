import React from 'react';

type Props = {
  onClick: () => void;
  isLoading: boolean;
};

const UpdateButton: React.FC<Props> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
    >
      {isLoading ? 'Atualizando...' : 'Atualizar Horários'}
    </button>
  );
};

export default UpdateButton;
