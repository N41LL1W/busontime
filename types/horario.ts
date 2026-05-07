export interface Horario {
  id: number;
  origem: string;
  destino: string;
  horario: string;
  diaDaSemana: string;
  tarifa: number | null;
  observacao: string | null;
}

export type HorarioComFonte = Horario & { sourceUrl: string };
