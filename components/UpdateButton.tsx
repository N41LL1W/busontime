import React from 'react';
import { Loader2, RefreshCw } from 'lucide-react';

type Props = {
  onClick: () => void;
  isLoading: boolean;
};

const UpdateButton: React.FC<Props> = ({ onClick, isLoading }) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      {isLoading ? 'Atualizando...' : 'Atualizar horários'}
    </button>
  );
};

export default UpdateButton;
