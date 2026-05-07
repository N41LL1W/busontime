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

  const routeGroups = Array.from(
    scrapedData.reduce((groups, item) => {
      const key = `${item.origem}|||${item.destino}|||${item.diaDaSemana}`;
      groups.set(key, {
        origem: item.origem,
        destino: item.destino,
        diaDaSemana: item.diaDaSemana,
      });
      return groups;
    }, new Map<string, { origem: string; destino: string; diaDaSemana: string }>()),
  ).map(([, group]) => group);

  console.log(
    `[${sourceIdentifier}] Iniciando transação para ${routeGroups.length} combinação(ões) de origem/destino/dia.`,
  );

  try {
    const transaction = await prisma.$transaction([
      ...routeGroups.map((group) =>
        prisma.horario.deleteMany({
          where: group,
        }),
      ),
      // Passo final: Criar os novos registros
      prisma.horario.createMany({
        data: scrapedData,
        skipDuplicates: true, // Segurança extra
      }),
    ]);

    const deletedCount = transaction
      .slice(0, routeGroups.length)
      .reduce((total, result) => total + result.count, 0);
    const createdCount = transaction[transaction.length - 1].count;

    console.log(`[${sourceIdentifier}] Transação concluída. Deletados: ${deletedCount}, Criados: ${createdCount}`);
  } catch (error) {
    console.error(`[${sourceIdentifier}] ERRO na transação do banco de dados:`, error);
    // A transação será revertida automaticamente em caso de erro.
    throw new Error(`Falha ao sincronizar dados para ${sourceIdentifier}`);
  }
}