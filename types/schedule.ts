// types/schedule.ts

export interface Horario {
  id: number;
  origem: string;
  destino: string;
  horario: string;
  diaDaSemana: string;
  observacao?: string | null;
}
