// lib/database-sync.ts
import prisma from "./prisma"; // Assumindo que você tem um prisma singleton em lib/prisma.ts
import type { Horario } from "@prisma/client";

// Define um tipo para os dados brutos que vêm dos scrapers
type ScrapedHorario = Omit<Horario, "id" | "tarifa"> & { tarifa?: number | null };

/**
 * Sincroniza os horários de uma fonte específica com o banco de dados.
 * Esta função realiza um "upsert" transacional:
 * 1. Deleta todos os horários antigos para a combinação origem/destino/dia.
 * 2. Insere os novos horários raspados.
 * Tudo isso em uma única transação para garantir a consistência dos dados.
 *
 * @param sourceIdentifier - Um nome único para a fonte do scraper (ex: "jaboticabal-cheerio")
 * @param scrapedData - Um array de horários raspados da fonte.
 */
export async function syncSchedules(sourceIdentifier: string, scrapedData: ScrapedHorario[]) {
  if (scrapedData.length === 0) {
    console.log(`[${sourceIdentifier}] Nenhum dado recebido para sincronizar. Pulando.`);
    return;
  }

  // Agrupa os dados para identificar unicamente os registros a serem deletados.
  // Pega a primeira origem, destino e todos os dias da semana dos dados raspados.
  const representativeData = scrapedData[0];
  const allWeekDays = Array.from(new Set(scrapedData.map(d => d.diaDaSemana)));

  console.log(`[${sourceIdentifier}] Iniciando transação para ${representativeData.origem} -> ${representativeData.destino} nos dias: ${allWeekDays.join(', ')}`);

  try {
    const transaction = await prisma.$transaction([
      // Passo 1: Deletar os registros antigos para esta rota e dias da semana
      prisma.horario.deleteMany({
        where: {
          origem: representativeData.origem,
          destino: representativeData.destino,
          diaDaSemana: { in: allWeekDays },
        },
      }),
      // Passo 2: Criar os novos registros
      prisma.horario.createMany({
        data: scrapedData,
        skipDuplicates: true, // Segurança extra
      }),
    ]);

    console.log(`[${sourceIdentifier}] Transação concluída. Deletados: ${transaction[0].count}, Criados: ${transaction[1].count}`);
  } catch (error) {
    console.error(`[${sourceIdentifier}] ERRO na transação do banco de dados:`, error);
    // A transação será revertida automaticamente em caso de erro.
    throw new Error(`Falha ao sincronizar dados para ${sourceIdentifier}`);
  }
}