// types/schedule.ts

export interface Schedule {
    id: string;
    itinerario: string;
    diaDaSemana: string; // Ex: "Segunda à Sexta", "Sábado", "Domingo e Feriados"
    horario: string; // Ex: "14:30"
    tarifa?: string;
    observacao?: string;
  }
  