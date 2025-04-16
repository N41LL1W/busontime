import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function atualizarHorarios() {
  try {
    // Obtém os horários raspados (ajuste conforme seu formato)
    const horariosRaspados = await getHorariosRaspados(); // Supondo que você tenha essa função implementada

    // Obtém os horários do banco de dados
    const horariosBanco = await prisma.horario.findMany();

    // Comparar os horários raspados com os do banco de dados e atualizar
    for (const horario of horariosRaspados) {
      const horarioBanco = horariosBanco.find(h => h.horario === horario.horario);

      if (horarioBanco) {
        // Se o horário já existe, atualize-o
        await prisma.horario.update({
          where: { id: horarioBanco.id },
          data: horario,
        });
      } else {
        // Se o horário não existe, crie um novo
        await prisma.horario.create({
          data: horario,
        });
      }
    }

    // Excluir horários que não estão mais na raspagem
    for (const horarioBanco of horariosBanco) {
      const horarioRaspado = horariosRaspados.find(h => h.horario === horarioBanco.horario);
      if (!horarioRaspado) {
        await prisma.horario.delete({
          where: { id: horarioBanco.id },
        });
      }
    }

    console.log('Horários atualizados com sucesso!');
  } catch (error) {
    console.error('Erro ao atualizar horários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Função simulada para pegar horários raspados
async function getHorariosRaspados() {
  // Aqui você deve implementar a raspagem real de horários
  return [
    { horario: '07:45', origem: 'Ribeirão Preto', destino: 'Jardinópolis', diaDaSemana: 'Segunda a Sexta' },
    { horario: '08:00', origem: 'Ribeirão Preto', destino: 'Brodowski', diaDaSemana: 'Segunda a Sexta' },
    // Adicione mais horários aqui conforme necessário
  ];
}

atualizarHorarios();
