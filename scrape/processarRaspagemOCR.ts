import Tesseract from "tesseract.js";
import prisma from "@/lib/prisma";

// Extrai os horários do texto OCR
function limparHorarios(texto: string): string[] {
  const regex = /\b\d{1,2}[:hH]\d{2}\b/g;
  const encontrados = texto.match(regex);
  if (!encontrados) return [];

  return encontrados.map(hora => hora.replace(/[hH]/, ":").padStart(5, "0"));
}

export default async function processarRaspagemOCR(
  imagemURL: string,
  origem: string,
  destino: string,
  diaDaSemana: string
) {
  try {
    const resultado = await Tesseract.recognize(imagemURL, "por", {
      logger: m => console.log(m)
    });

    const textoExtraido = resultado.data.text;
    console.log(`Texto OCR para ${origem} → ${destino} (${diaDaSemana}):\n`, textoExtraido);

    const horarios = limparHorarios(textoExtraido);

    for (const horario of horarios) {
      // Verifica se já existe o mesmo registro antes de inserir
      const existente = await prisma.horario.findFirst({
        where: {
          origem,
          destino,
          horario,
          diaDaSemana
        }
      });

      if (!existente) {
        await prisma.horario.create({
          data: {
            origem,
            destino,
            horario,
            diaDaSemana
          }
        });
        console.log(`🟢 Inserido: ${origem} → ${destino} - ${horario} (${diaDaSemana})`);
      } else {
        console.log(`⚪️ Já existe: ${origem} → ${destino} - ${horario} (${diaDaSemana})`);
      }
    }

    console.log(`✅ ${horarios.length} horários processados para ${origem} → ${destino} (${diaDaSemana})`);
  } catch (error) {
    console.error("❌ Erro no OCR:", error);
    throw error;
  }
}
