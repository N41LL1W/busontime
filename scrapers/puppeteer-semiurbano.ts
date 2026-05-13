import puppeteer from "puppeteer";
import type { HTTPResponse, Page } from "puppeteer";
import type { ScrapedHorario } from "../types/scrapers";

const DEFAULT_URL = "https://semiurbano.lovable.app/horarios";
const NAVIGATION_TIMEOUT_MS = 45_000;
const RESPONSE_LIMIT = 80;

const normalizarTexto = (texto: unknown) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/brodowsky/g, "brodowski")
    .replace(/cachoerinha/g, "cachoeirinha")
    .trim();

const formatarHorario = (hora: string, minuto: string) =>
  `${hora.padStart(2, "0")}:${minuto.padStart(2, "0")}`;

const extrairHorarios = (texto: string) => {
  const horarios = new Set<string>();
  const regex = /\b(\d{1,2})\s*(?::|h|H|\.)\s*(\d{2})\b/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(texto)) !== null) {
    const hora = Number(match[1]);
    const minuto = Number(match[2]);
    if (hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59) {
      horarios.add(formatarHorario(match[1], match[2]));
    }
  }

  return Array.from(horarios);
};

function identificarDia(texto: string) {
  const normalizado = normalizarTexto(texto);

  if (normalizado.includes("sabado")) return "Sábado";
  if (normalizado.includes("domingo") || normalizado.includes("feriado")) return "Domingo e Feriados";
  if (
    normalizado.includes("segunda") ||
    normalizado.includes("sexta") ||
    normalizado.includes("dias uteis") ||
    normalizado.includes("uteis")
  ) {
    return "Segunda à Sexta";
  }

  return null;
}

function rotaCompativel(origemEncontrada: string, destinoEncontrado: string, origem: string, destino: string) {
  const origemEncontradaNormalizada = normalizarTexto(origemEncontrada);
  const destinoEncontradoNormalizado = normalizarTexto(destinoEncontrado);
  const origemNormalizada = normalizarTexto(origem);
  const destinoNormalizado = normalizarTexto(destino);

  return (
    (origemEncontradaNormalizada === origemNormalizada && destinoEncontradoNormalizado === destinoNormalizado) ||
    (origemEncontradaNormalizada === destinoNormalizado && destinoEncontradoNormalizado === origemNormalizada)
  );
}

function blocoContemRota(bloco: string, origem: string, destino: string, label?: string) {
  const normalizado = normalizarTexto(bloco);
  const origemNormalizada = normalizarTexto(origem);
  const destinoNormalizado = normalizarTexto(destino);
  const labelNormalizada = label ? normalizarTexto(label) : "";

  return (
    (normalizado.includes(origemNormalizada) && normalizado.includes(destinoNormalizado)) ||
    (labelNormalizada.length > 0 && normalizado.includes(labelNormalizada))
  );
}

function extrairDoTexto(texto: string, origem: string, destino: string, label?: string) {
  if (!blocoContemRota(texto, origem, destino, label)) return [];

  const horarios: ScrapedHorario[] = [];
  const partes = texto
    .replace(/[{}[\](),;]/g, "\n")
    .replace(/<[^>]+>/g, "\n")
    .split(/\n|\\n|\||\t/)
    .map((linha) => linha.replace(/["'`]/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

  let diaDaSemanaAtual = "Segunda à Sexta";
  let sentidoAtual: "ida" | "volta" = "ida";

  for (const parte of partes) {
    const dia = identificarDia(parte);
    if (dia) {
      diaDaSemanaAtual = dia;
      continue;
    }

    const parteNormalizada = normalizarTexto(parte);
    const origemNormalizada = normalizarTexto(origem);
    const destinoNormalizado = normalizarTexto(destino);

    if (parteNormalizada.includes(destinoNormalizado) && parteNormalizada.includes(origemNormalizada)) {
      sentidoAtual = parteNormalizada.indexOf(destinoNormalizado) < parteNormalizada.indexOf(origemNormalizada) ? "volta" : "ida";
    } else if (parteNormalizada.includes(destinoNormalizado)) {
      sentidoAtual = "volta";
    } else if (parteNormalizada.includes(origemNormalizada)) {
      sentidoAtual = "ida";
    }

    for (const horario of extrairHorarios(parte)) {
      horarios.push({
        origem: sentidoAtual === "ida" ? origem : destino,
        destino: sentidoAtual === "ida" ? destino : origem,
        diaDaSemana: diaDaSemanaAtual,
        horario,
        observacao: "Extraído do site Semiurbano São Bento com navegador automatizado",
        tarifa: null,
      });
    }
  }

  return horarios;
}

function deduplicar(horarios: ScrapedHorario[]) {
  const mapa = new Map<string, ScrapedHorario>();

  for (const item of horarios) {
    mapa.set(`${item.origem}|${item.destino}|${item.diaDaSemana}|${item.horario}`, item);
  }

  return Array.from(mapa.values()).sort((a, b) =>
    `${a.origem}|${a.destino}|${a.diaDaSemana}|${a.horario}`.localeCompare(
      `${b.origem}|${b.destino}|${b.diaDaSemana}|${b.horario}`,
      "pt-BR",
    ),
  );
}

async function aguardar(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function aplicarEvasoesBasicas(page: Page) {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => false,
    });

    Object.defineProperty(navigator, "languages", {
      get: () => ["pt-BR", "pt", "en"],
    });

    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
  });
}

async function coletarResposta(response: HTTPResponse) {
  const url = response.url();
  const contentType = response.headers()["content-type"] ?? "";

  if (!response.ok()) return "";
  if (!/json|text|html|javascript/i.test(contentType)) return "";
  if (!/semiurbano|supabase|lovable/i.test(url)) return "";

  const text = await response.text().catch(() => "");
  if (!text || text.length > 500_000) return "";

  return `${url}\n${text}`;
}

async function selecionarCidade(page: Page, termo: string, campo: "origem" | "destino", indiceCampo: number) {
  const triggerSelector = `button[aria-label*="Selecionar ${campo}" i], [role="combobox"][aria-label*="${campo}" i]`;
  const trigger = (await page.$(triggerSelector)) ?? (await page.$$("button[aria-haspopup='listbox'], [role='combobox']"))[indiceCampo];

  if (trigger) {
    await trigger.click().catch(() => undefined);
    await aguardar(300);

    const selecionou = await page.evaluate((termoAvaliado) => {
      const normalizar = (valor: string) =>
        valor
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim();
      const visivel = (elemento: Element) => {
        const rect = elemento.getBoundingClientRect();
        const style = window.getComputedStyle(elemento);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      const termoNormalizado = normalizar(termoAvaliado);
      const candidatos = Array.from(
        document.querySelectorAll('[role="option"], [role="listbox"] button, [cmdk-item], [data-radix-collection-item], li, button'),
      ) as HTMLElement[];
      const opcao = candidatos.find((item) => visivel(item) && normalizar(item.textContent ?? "").includes(termoNormalizado));

      if (!opcao) return false;
      opcao.click();
      return true;
    }, termo);

    if (selecionou) {
      await aguardar(500);
      return;
    }
  }

  await selecionarOuDigitar(page, termo, campo, indiceCampo);
}

async function selecionarOuDigitar(page: Page, termo: string, campo: "origem" | "destino", indiceCampo: number) {
  const conseguiu = await page.evaluate(
    ({ termo: termoAvaliado, campo: campoAvaliado, indiceCampo: indiceCampoAvaliado }) => {
      const normalizar = (valor: string) =>
        valor
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const visivel = (elemento: Element) => {
        const rect = elemento.getBoundingClientRect();
        const style = window.getComputedStyle(elemento);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      const matchesCampo = (elemento: Element) => {
        const texto = normalizar([
          elemento.getAttribute("aria-label") ?? "",
          elemento.getAttribute("placeholder") ?? "",
          elemento.getAttribute("name") ?? "",
          elemento.getAttribute("id") ?? "",
          elemento.closest("label")?.textContent ?? "",
          elemento.parentElement?.textContent ?? "",
        ].join(" "));
        return texto.includes(campoAvaliado);
      };

      const selects = Array.from(document.querySelectorAll("select")).filter(visivel) as HTMLSelectElement[];
      const select = selects.find(matchesCampo) ?? selects[indiceCampoAvaliado];
      if (select) {
        const termoNormalizado = normalizar(termoAvaliado);
        const option = Array.from(select.options).find((item) => normalizar(item.textContent ?? item.value).includes(termoNormalizado));
        if (option) {
          select.value = option.value;
          select.dispatchEvent(new Event("input", { bubbles: true }));
          select.dispatchEvent(new Event("change", { bubbles: true }));
          return true;
        }
      }

      return false;
    },
    { termo, campo, indiceCampo },
  );

  if (conseguiu) return;

  const selectors = [
    `input[placeholder*="${campo}" i]`,
    `input[aria-label*="${campo}" i]`,
    `[role="combobox"][aria-label*="${campo}" i]`,
    "input:not([type='hidden']):not([disabled])",
    "[role='combobox']",
  ];

  const handles = await page.$$(selectors.join(","));
  const handle = handles[indiceCampo] ?? handles[0];
  if (!handle) return;

  await handle.click({ clickCount: 3 }).catch(() => undefined);
  await page.keyboard.press("Backspace").catch(() => undefined);
  await page.keyboard.type(termo, { delay: 20 }).catch(() => undefined);
  await aguardar(500);

  const termoNormalizado = normalizarTexto(termo);
  const optionHandle = await page.evaluateHandle((normalizado) => {
    const options = Array.from(document.querySelectorAll('[role="option"], li, [cmdk-item], button'));
    return (
      options.find((option) =>
        option.textContent
          ?.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(normalizado),
      ) ?? null
    );
  }, termoNormalizado);

  const option = optionHandle.asElement() as import("puppeteer").ElementHandle<Element> | null;
  if (option) {
    await option.click().catch(() => undefined);
  } else {
    await page.keyboard.press("Enter").catch(() => undefined);
  }
}

async function submeterPesquisa(page: Page) {
  const clicou = await page.evaluate(() => {
    const normalizar = (valor: string) =>
      valor
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const botoes = Array.from(document.querySelectorAll("button, [role='button'], input[type='submit']")) as HTMLElement[];
    const botao = botoes.find((item) => /buscar|pesquisar|consultar|horario|ver/.test(normalizar(item.textContent ?? item.getAttribute("value") ?? "")));
    if (!botao) return false;
    botao.click();
    return true;
  });

  if (!clicou) {
    await page.keyboard.press("Enter").catch(() => undefined);
  }
}

async function mostrarHorariosDeVolta(page: Page) {
  const clicou = await page.evaluate(() => {
    const normalizar = (valor: string) =>
      valor
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const botoes = Array.from(document.querySelectorAll("button, [role='button']")) as HTMLElement[];
    const botao = botoes.find((item) => normalizar(item.textContent ?? "").includes("horarios de volta"));
    if (!botao) return false;
    botao.click();
    return true;
  });

  if (clicou) await aguardar(800);
}

async function extrairTextoVisivel(page: Page) {
  return page.evaluate(() => {
    const linhas = [document.body?.innerText ?? ""];
    for (const tabela of Array.from(document.querySelectorAll("table"))) {
      linhas.push(tabela.textContent ?? "");
    }
    return linhas.join("\n");
  });
}
async function extrairHorariosDoHtml(page: Page, origem: string, destino: string): Promise<ScrapedHorario[]> {
  return page.evaluate(
    ({ origem: origemSolicitada, destino: destinoSolicitado }) => {
      const normalizar = (valor: unknown) =>
        String(valor ?? "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, " ")
          .replace(/brodowsky/g, "brodowski")
          .replace(/cachoerinha/g, "cachoeirinha")
          .trim();
      const parseHorario = (valor: string) => {
        const match = valor.match(/\b(\d{1,2})\s*(?::|h|H|\.)\s*(\d{2})\b/);
        if (!match) return "";
        const hora = Number(match[1]);
        const minuto = Number(match[2]);
        if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) return "";
        return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
      };
      const getDia = (elemento: Element) => {
        let atual: Element | null = elemento;
        while (atual) {
          const titulo = atual.querySelector("h3")?.textContent ?? "";
          const normalizado = normalizar(titulo || atual.textContent);
          if (normalizado.includes("sabado")) return "Sábado";
          if (normalizado.includes("domingo") || normalizado.includes("feriado")) return "Domingo e Feriados";
          if (normalizado.includes("segunda") || normalizado.includes("sexta") || normalizado.includes("uteis")) {
            return "Segunda à Sexta";
          }
          atual = atual.parentElement;
        }
        return "Segunda à Sexta";
      };
      const rotaCompativelNoBrowser = (origemEncontrada: string, destinoEncontrado: string) => {
        const origemEncontradaNormalizada = normalizar(origemEncontrada);
        const destinoEncontradoNormalizado = normalizar(destinoEncontrado);
        const origemSolicitadaNormalizada = normalizar(origemSolicitada);
        const destinoSolicitadoNormalizada = normalizar(destinoSolicitado);

        return (
          (origemEncontradaNormalizada === origemSolicitadaNormalizada && destinoEncontradoNormalizado === destinoSolicitadoNormalizada) ||
          (origemEncontradaNormalizada === destinoSolicitadoNormalizada && destinoEncontradoNormalizado === origemSolicitadaNormalizada)
        );
      };

      const registros: Array<{
        origem: string;
        destino: string;
        diaDaSemana: string;
        horario: string;
        tarifa: null;
        observacao: string;
      }> = [];
      const headers = Array.from(document.querySelectorAll("div.mb-3, div[class*='mb-3']")) as HTMLElement[];

      for (const header of headers) {
        const textoHeader = header.textContent?.replace(/\s+/g, " ").trim() ?? "";
        if (!normalizar(textoHeader).includes("saindo de") || !textoHeader.includes("→")) continue;

        const origemTexto = Array.from(header.querySelectorAll("span"))
          .map((span) => span.textContent?.trim() ?? "")
          .find((texto) => normalizar(texto).startsWith("saindo de"))
          ?.replace(/^Saindo de\s+/i, "")
          .trim();
        const destinoTexto = Array.from(header.querySelectorAll("span"))
          .map((span) => span.textContent?.trim() ?? "")
          .find((texto) => texto.includes("→"))
          ?.replace(/^→\s*/i, "")
          .trim();

        if (!origemTexto || !destinoTexto || !rotaCompativelNoBrowser(origemTexto, destinoTexto)) continue;

        const bloco = header.parentElement;
        if (!bloco) continue;

        const diaDaSemana = getDia(bloco);
        const botoesHorario = Array.from(bloco.querySelectorAll("button")) as HTMLButtonElement[];
        for (const botao of botoesHorario) {
          const horario = parseHorario(botao.textContent ?? "");
          if (!horario) continue;

          const className = botao.getAttribute("class") ?? "";
          const passaPorIntermediario = className.includes("amber");
          registros.push({
            origem: origemTexto,
            destino: destinoTexto,
            diaDaSemana,
            horario,
            tarifa: null,
            observacao: passaPorIntermediario
              ? "Extraído do HTML do Semiurbano São Bento; passa por ponto intermediário"
              : "Extraído do HTML do Semiurbano São Bento; saída da rodoviária",
          });
        }
      }

      return registros;
    },
    { origem, destino },
  );
}


export type SemiurbanoTesteHorario = {
  horario: string;
  tipo: "rodoviaria" | "intermediario";
  observacao: string;
};

export type SemiurbanoTesteSentido = {
  diaDaSemana: string;
  origem: string;
  destino: string;
  totalInformado: number | null;
  horarios: SemiurbanoTesteHorario[];
  pontosDeParada: string[];
};

export type SemiurbanoTesteResultado = {
  sourceUrl: string;
  pesquisadoEm: string;
  origemSelecionada: string;
  destinoSelecionado: string;
  linha: string | null;
  tarifas: Array<{ tipo: string; valor: string }>;
  sentidos: SemiurbanoTesteSentido[];
  textoVisivel: string;
};

async function extrairPainelTeste(page: Page): Promise<Omit<SemiurbanoTesteResultado, "sourceUrl" | "pesquisadoEm" | "origemSelecionada" | "destinoSelecionado">> {
  return page.evaluate(() => {
    const limpar = (valor: unknown) => String(valor ?? "").replace(/\s+/g, " ").trim();
    const normalizar = (valor: unknown) =>
      limpar(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    const parseHorario = (valor: string) => {
      const match = valor.match(/\b(\d{1,2})\s*(?::|h|H|\.)\s*(\d{2})\b/);
      if (!match) return "";
      const hora = Number(match[1]);
      const minuto = Number(match[2]);
      if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) return "";
      return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
    };
    const encontrarPai = (elemento: Element | null, predicado: (item: Element) => boolean) => {
      let atual = elemento;
      while (atual) {
        if (predicado(atual)) return atual;
        atual = atual.parentElement;
      }
      return null;
    };

    const linha =
      Array.from(document.querySelectorAll("div, header, section"))
        .map((item) => limpar(item.textContent))
        .find((texto) => texto.includes(" X ") && /comum\/vt|estudante/i.test(texto))
        ?.replace(/Comum\/VT:.*$/i, "")
        .trim() || null;

    const tarifas: Array<{ tipo: string; valor: string }> = [];
    const textoCompleto = document.body?.innerText ?? "";
    for (const match of textoCompleto.matchAll(/(Comum\/VT|Estudante):\s*(R\$\s*\d+[,.]\d{2})/gi)) {
      const tipo = limpar(match[1]);
      const valor = limpar(match[2]);
      if (!tarifas.some((item) => item.tipo === tipo && item.valor === valor)) {
        tarifas.push({ tipo, valor });
      }
    }

    const sentidos: Array<{
      diaDaSemana: string;
      origem: string;
      destino: string;
      totalInformado: number | null;
      horarios: Array<{ horario: string; tipo: "rodoviaria" | "intermediario"; observacao: string }>;
      pontosDeParada: string[];
    }> = [];

    const headers = Array.from(document.querySelectorAll("div.mb-3, div[class*='mb-3']")) as HTMLElement[];
    for (const header of headers) {
      const textoHeader = limpar(header.textContent);
      if (!normalizar(textoHeader).includes("saindo de") || !textoHeader.includes("→")) continue;

      const spans = Array.from(header.querySelectorAll("span")).map((span) => limpar(span.textContent));
      const origem = spans.find((texto) => normalizar(texto).startsWith("saindo de"))?.replace(/^Saindo de\s+/i, "").trim() || "";
      const destino = spans.find((texto) => texto.includes("→"))?.replace(/^→\s*/i, "").replace(/\(.*\)$/g, "").trim() || "";
      const totalMatch = textoHeader.match(/\((\d+)\s+hor[aá]rios?\)/i);
      const totalInformado = totalMatch ? Number(totalMatch[1]) : null;
      if (!origem || !destino) continue;

      const bloco = header.parentElement;
      if (!bloco) continue;

      const diaContainer = encontrarPai(bloco, (item) => Boolean(item.querySelector("h3")));
      const diaDaSemana = limpar(diaContainer?.querySelector("h3")?.textContent) || "Não informado";
      const horarios = Array.from(bloco.querySelectorAll("button"))
        .map((botao) => {
          const horario = parseHorario(botao.textContent ?? "");
          if (!horario) return null;
          const className = botao.getAttribute("class") ?? "";
          const intermediario = className.includes("amber");
          return {
            horario,
            tipo: intermediario ? "intermediario" as const : "rodoviaria" as const,
            observacao: intermediario ? "Passa por ponto intermediário" : "Saída da Rodoviária",
          };
        })
        .filter((item): item is { horario: string; tipo: "rodoviaria" | "intermediario"; observacao: string } => Boolean(item));

      const pontosDeParada = Array.from(bloco.querySelectorAll("label"))
        .map((label) => limpar(label.textContent))
        .filter(Boolean);

      sentidos.push({ diaDaSemana, origem, destino, totalInformado, horarios, pontosDeParada });
    }

    return {
      linha,
      tarifas,
      sentidos,
      textoVisivel: document.body?.innerText ?? "",
    };
  });
}

function juntarSentidos(sentidos: SemiurbanoTesteSentido[]) {
  const mapa = new Map<string, SemiurbanoTesteSentido>();

  for (const sentido of sentidos) {
    const chave = `${sentido.diaDaSemana}|${sentido.origem}|${sentido.destino}`;
    const atual = mapa.get(chave);
    if (!atual) {
      mapa.set(chave, {
        ...sentido,
        horarios: [...sentido.horarios],
        pontosDeParada: [...sentido.pontosDeParada],
      });
      continue;
    }

    for (const horario of sentido.horarios) {
      if (!atual.horarios.some((item) => item.horario === horario.horario && item.tipo === horario.tipo)) {
        atual.horarios.push(horario);
      }
    }
    for (const ponto of sentido.pontosDeParada) {
      if (!atual.pontosDeParada.includes(ponto)) atual.pontosDeParada.push(ponto);
    }
    atual.totalInformado = atual.totalInformado ?? sentido.totalInformado;
  }

  return Array.from(mapa.values()).sort((a, b) => `${a.diaDaSemana}|${a.origem}|${a.destino}`.localeCompare(`${b.diaDaSemana}|${b.origem}|${b.destino}`, "pt-BR"));
}

export async function testarRaspagemSemiurbanoBrodowskiRibeirao(url = DEFAULT_URL): Promise<SemiurbanoTesteResultado> {
  const origem = "Brodowski";
  const destino = "Ribeirão Preto";
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await aplicarEvasoesBasicas(page);
    page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" });

    await page.goto(url, { waitUntil: "networkidle2", timeout: NAVIGATION_TIMEOUT_MS });
    await selecionarCidade(page, origem, "origem", 0);
    await selecionarCidade(page, destino, "destino", 1);
    await submeterPesquisa(page);
    await Promise.race([
      page.waitForNetworkIdle({ idleTime: 1000, timeout: 15_000 }).catch(() => undefined),
      aguardar(15_000),
    ]);
    await aguardar(1_000);

    const ida = await extrairPainelTeste(page);
    await mostrarHorariosDeVolta(page);
    await aguardar(1_000);
    const volta = await extrairPainelTeste(page);

    const tarifas = [...ida.tarifas];
    for (const tarifa of volta.tarifas) {
      if (!tarifas.some((item) => item.tipo === tarifa.tipo && item.valor === tarifa.valor)) tarifas.push(tarifa);
    }

    return {
      sourceUrl: url,
      pesquisadoEm: new Date().toISOString(),
      origemSelecionada: origem,
      destinoSelecionado: destino,
      linha: ida.linha ?? volta.linha,
      tarifas,
      sentidos: juntarSentidos([...ida.sentidos, ...volta.sentidos]),
      textoVisivel: volta.textoVisivel || ida.textoVisivel,
    };
  } finally {
    await browser?.close().catch(() => undefined);
  }
}

type PuppeteerRouteOptions = {
  url?: string;
  origem: string;
  destino: string;
  label?: string;
};

export async function scrapeSemiurbanoPuppeteerRoute({
  url = DEFAULT_URL,
  origem,
  destino,
  label,
}: PuppeteerRouteOptions): Promise<ScrapedHorario[]> {
  console.log(`[Semiurbano Navegador] Pesquisando ${origem} -> ${destino} em ${url}`);

  const responses: string[] = [];
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await aplicarEvasoesBasicas(page);
    page.setDefaultTimeout(NAVIGATION_TIMEOUT_MS);
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8" });
    page.on("response", (response) => {
      if (responses.length >= RESPONSE_LIMIT) return;
      coletarResposta(response)
        .then((texto) => {
          if (texto) responses.push(texto);
        })
        .catch(() => undefined);
    });

    await page.goto(url, { waitUntil: "networkidle2", timeout: NAVIGATION_TIMEOUT_MS });
    await selecionarCidade(page, origem, "origem", 0);
    await selecionarCidade(page, destino, "destino", 1);
    await submeterPesquisa(page);
    await Promise.race([
      page.waitForNetworkIdle({ idleTime: 1000, timeout: 15_000 }).catch(() => undefined),
      aguardar(15_000),
    ]);
    await mostrarHorariosDeVolta(page);
    await aguardar(1_000);

    const horariosDoHtml = await extrairHorariosDoHtml(page, origem, destino);
    const textos = [await extrairTextoVisivel(page), ...responses];
    const horarios = deduplicar([
      ...textos.flatMap((texto) => extrairDoTexto(texto, origem, destino, label)),
      ...horariosDoHtml,
    ]).filter((item) => rotaCompativel(item.origem, item.destino, origem, destino));

    console.log(`[Semiurbano Navegador] Coleta finalizada para ${origem} -> ${destino}: ${horarios.length} horário(s).`);
    return horarios;
  } catch (error) {
    console.error(`[Semiurbano Navegador] Erro ao pesquisar ${origem} -> ${destino}:`, error);
    return [];
  } finally {
    await browser?.close().catch(() => undefined);
  }
}