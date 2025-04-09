// types/schedule.ts

export interface Horario {
  id: string;
  origem: string;
  destino: string;
  horario: string;
  diaDaSemana: string;
  observacao?: string;
}
