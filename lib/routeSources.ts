import type { Horario } from "../types/horario";

// Mapa de fontes: a chave deve ser "origem-destino" em letras minúsculas.
const fontesDasRotas: Record<string, string> = {
  // Rotas da RibeTransporte
  "ribeirão preto-jardinópolis": "https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/",
  "jardinópolis-ribeirão preto": "https://www.ribetransporte.com.br/linha-01/",

  // Rotas de OCR (VSB) - a mesma URL para ida e volta.
  "barrinha-sertãozinho": "https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg",
  "sertãozinho-barrinha": "https://suburbano.vsb.com.br/wp-content/uploads/2022/09/03-09-2022-Sertaozinho-x-Barrinha-jpg-1085x1536.jpg",
  "batatais-altinópolis": "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg",
  "altinópolis-batatais": "https://suburbano.vsb.com.br/wp-content/uploads/2024/10/03-10-2024-Batatais-x-Altinopolis_page-0001-1-1-scaled.jpg",
};

export const getRouteSourceUrl = (horario: Pick<Horario, "origem" | "destino">) => {
  const routeKey = `${horario.origem.toLowerCase()}-${horario.destino.toLowerCase()}`;
  return fontesDasRotas[routeKey] || "";
};
