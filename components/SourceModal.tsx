import { X } from "lucide-react";

interface SourceModalProps {
  url: string;
  onClose: () => void;
}

export default function SourceModal({ url, onClose }: SourceModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Fonte do horário</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Os dados foram extraídos de:</p>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-primary underline break-all hover:opacity-80"
        >
          {url}
        </a>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
