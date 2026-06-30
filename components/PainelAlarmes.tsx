"use client";

import { Bell, X, Clock } from "lucide-react";
import { useAlarmes, type Intervalo } from "../hooks/useAlarmes";

function tempoAteHorario(horario: string, data: string): string {
  const [h, m] = horario.split(":").map(Number);
  const alvo = new Date(`${data}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  const diff = Math.round((alvo.getTime() - Date.now()) / 60000);
  if (diff < 0) return "passou";
  if (diff === 0) return "agora";
  if (diff < 60) return `em ${diff} min`;
  const hrs = Math.floor(diff / 60);
  const mins = diff % 60;
  return mins > 0 ? `em ${hrs}h ${mins}min` : `em ${hrs}h`;
}

const LABEL_INTERVALO: Record<Intervalo, string> = {
  60: "60min",
  30: "30min",
  15: "15min",
  5: "5min",
};

export default function PainelAlarmes() {
  const { alarmes, removerAlarme } = useAlarmes();

  const hoje = new Date().toISOString().slice(0, 10);
  const ativos = alarmes
    .filter((a) => a.data >= hoje)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  if (ativos.length === 0) return null;

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/20">
        <Bell className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Alarmes ativos
        </span>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {ativos.length}
        </span>
      </div>

      <div className="divide-y">
        {ativos.map((alarme) => (
          <div key={alarme.id} className="flex items-center gap-3 px-4 py-3">
            {/* Horário */}
            <div className="shrink-0">
              <span className="font-mono text-xl font-bold tabular-nums text-primary">
                {alarme.horario}
              </span>
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <Clock size={9} />
                {tempoAteHorario(alarme.horario, alarme.data)}
              </p>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {alarme.origem} → {alarme.destino}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {alarme.intervalos.map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {LABEL_INTERVALO[i]}
                  </span>
                ))}
              </div>
            </div>

            {/* Remover */}
            <button
              onClick={() => removerAlarme(alarme.id)}
              className="shrink-0 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors"
              title="Remover alarme"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
