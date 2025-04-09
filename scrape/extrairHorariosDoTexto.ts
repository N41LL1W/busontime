export function extrairHorariosDoTexto(
  texto: string,
  itinerario: string,
  tarifa: string,
  diasSemana: string[]
) {
  const horarios: {
    itinerario: string;
    diaDaSemana: string;
    horario: string;
    tarifa: string;
    observacao?: string;
  }[] = [];

  // Normaliza o texto
  const textoNormalizado = texto.toLowerCase();

  // Define os possíveis títulos para separar os blocos
  const blocos = textoNormalizado.split(/(?=ribeirão preto\s*→\s*brodowski|brodowski\s*→\s*ribeirão preto)/i);

  for (const bloco of blocos) {
    // Confere se o bloco atual é do itinerário desejado
    const itinerarioFormatado = itinerario.toLowerCase().replace(/\s+/g, " ");
    if (!bloco.includes(itinerarioFormatado)) continue;

    for (const dia of diasSemana) {
      const diaFormatado = dia.toLowerCase();
      const regex = new RegExp(`${diaFormatado}[^\\d]*([\\d:\\s]+)`, "i");
      const match = bloco.match(regex);

      if (match && match[1]) {
        const horas = match[1]
          .split(/\s+/)
          .map((h) => h.trim())
          .filter((h) => h.includes(":"));

        for (const hora of horas) {
          horarios.push({
            itinerario,
            diaDaSemana: dia,
            horario: hora,
            tarifa,
          });
        }
      }
    }
  }

  return horarios;
}
