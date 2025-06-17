import type { Horario } from "@prisma/client";

/**
 * Este é o formato de dados que TODA função de scraper deve retornar.
 * É o modelo 'Horario' do Prisma, mas sem o campo 'id' que é gerado pelo banco.
 */
export type ScrapedHorario = Omit<Horario, "id">;