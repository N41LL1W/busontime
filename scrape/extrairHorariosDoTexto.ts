export function extrairHorariosDoTexto(
  texto: string,
  origem: string,
  tarifa: string,
  diasSemana: string[]
) {
  const horarios: {
    origem: string;
    diaDaSemana: string;
    horario: string;
    tarifa: string;
    observacao?: string;
  }[] = [];

  const textoNormalizado = texto.toLowerCase();

  const blocos = textoNormalizado.split(
    /(?=ribeirão preto\s*→\s*[\w\s]+|[\w\s]+\s*→\s*ribeirão preto)/i
  );

  const origemFormatada = origem.toLowerCase().replace(/\s+/g, " ").trim();

  for (const bloco of blocos) {
    if (!bloco.includes(origemFormatada)) continue;

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
            origem,
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
