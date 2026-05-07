// lib/database-sync.ts
import prisma from './prisma';
import type { Horario } from '@prisma/client';

// Define um tipo para os dados brutos que vêm dos scrapers
type ScrapedHorario = Omit<Horario, 'id' | 'tarifa'> & { tarifa?: number | null };

function uniqueSchedules(scrapedData: ScrapedHorario[]) {
  const seen = new Set<string>();

  return scrapedData.filter((schedule) => {
    const key = [schedule.origem, schedule.destino, schedule.diaDaSemana, schedule.horario, schedule.observacao || '', schedule.tarifa ?? ''].join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/**
 * Sincroniza os horários de uma fonte específica com o banco de dados.
 * Esta função remove os registros antigos das rotas/dias raspados e insere a carga nova
 * em uma única transação, evitando duplicação em reexecuções de scraping.
 *
 * @param sourceIdentifier - Um nome único para a fonte do scraper (ex: "jaboticabal-cheerio")
 * @param scrapedData - Um array de horários raspados da fonte.
 */
export async function syncSchedules(sourceIdentifier: string, scrapedData: ScrapedHorario[]) {
  const schedules = uniqueSchedules(scrapedData);

  if (schedules.length === 0) {
    console.log(`[${sourceIdentifier}] Nenhum dado recebido para sincronizar. Pulando.`);
    return;
  }

  const routeDayKeys = Array.from(
    new Map(
      schedules.map((schedule) => [
        `${schedule.origem}|${schedule.destino}|${schedule.diaDaSemana}`,
        {
          origem: schedule.origem,
          destino: schedule.destino,
          diaDaSemana: schedule.diaDaSemana,
        },
      ])
    ).values()
  );

  console.log(`[${sourceIdentifier}] Iniciando transação para ${routeDayKeys.length} combinações de rota/dia.`);

  try {
    const transaction = await prisma.$transaction([
      prisma.horario.deleteMany({
        where: {
          OR: routeDayKeys,
        },
      }),
      prisma.horario.createMany({
        data: schedules,
      }),
    ]);

    console.log(`[${sourceIdentifier}] Transação concluída. Deletados: ${transaction[0].count}, Criados: ${transaction[1].count}`);
  } catch (error) {
    console.error(`[${sourceIdentifier}] ERRO na transação do banco de dados:`, error);
    throw new Error(`Falha ao sincronizar dados para ${sourceIdentifier}`);
  }
}
