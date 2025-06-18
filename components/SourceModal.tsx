"use client";

import { X } from 'lucide-react';

interface SourceModalProps {
  url: string;
  onClose: () => void;
}

export default function SourceModal({ url, onClose }: SourceModalProps) {
  // Verifica se a URL termina com uma extensão de imagem comum
  const isImage = /\.(jpeg|jpg|gif|png|webp)(\?.*)?$/.test(url.toLowerCase());

  return (
    // Fundo escuro que cobre a tela
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      {/* Contêiner do Modal */}
      <div 
        className="bg-background rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" 
        onClick={(e) => e.stopPropagation()} // Impede que o clique dentro do modal feche o modal
      >
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">Fonte do Horário</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted" aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>
        
        {/* Conteúdo (Imagem ou Iframe) */}
        <div className="p-2 md:p-4 flex-1 overflow-auto">
          {isImage ? (
            <img src={url} alt="Fonte do horário" className="w-full h-auto object-contain max-h-[75vh]" />
          ) : (
            <iframe src={url} title="Fonte do Horário" className="w-full h-[75vh] border-0" />
          )}
        </div>
        
        {/* Rodapé do Modal */}
        <div className="p-2 text-center text-xs text-muted-foreground border-t">
          <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
            Abrir fonte original em nova aba
          </a>
        </div>
      </div>
    </div>
  );
}