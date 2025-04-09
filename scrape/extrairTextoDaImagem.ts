import Tesseract from "tesseract.js";

export async function extrairTextoDaImagem(url: string): Promise<string> {
  const resultado = await Tesseract.recognize(url, "por", {
    logger: (m) => console.log(m),
  });

  return resultado.data.text;
}
