//scrape/salvarHorarios.ts
import prisma from "@/lib/prisma";

interface Horario {
  itinerario: string;
  diaDaSemana: string;
  horario: string;
  tarifa?: string | null;
  observacao?: string | null;
}

export async function salvarHorariosNoBanco(horarios: Horario[]) {
  for (const horario of horarios) {
    const [origem, destino] = horario.itinerario.split(" - ").map((s) => s.trim());

    const horarioExistente = await prisma.horario.findFirst({
      where: {
        origem,
        destino,
        diaDaSemana: horario.diaDaSemana,
        horario: horario.horario,
      },
    });

    if (horarioExistente) {
      await prisma.horario.update({
        where: { id: horarioExistente.id },
        data: {
          tarifa: horario.tarifa ? parseFloat(horario.tarifa) : null,
          observacao: horario.observacao,
        },
      });
    } else {
      await prisma.horario.create({
        data: {
          origem,
          destino,
          diaDaSemana: horario.diaDaSemana,
          horario: horario.horario,
          tarifa: horario.tarifa ? parseFloat(horario.tarifa) : null,
          observacao: horario.observacao,
        },
      });
    }
  }
}
