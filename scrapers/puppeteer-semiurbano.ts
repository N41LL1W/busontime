import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import type { HTTPResponse, Page } from "puppeteer";
import type { ScrapedHorario } from "../types/scrapers";

puppeteer.use(StealthPlugin());

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

async function extrairTextoVisivel(page: Page) {
  return page.evaluate(() => {
    const linhas = [document.body?.innerText ?? ""];
    for (const tabela of Array.from(document.querySelectorAll("table"))) {
      linhas.push(tabela.textContent ?? "");
    }
    return linhas.join("\n");
  });
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
    await selecionarOuDigitar(page, origem, "origem", 0);
    await selecionarOuDigitar(page, destino, "destino", 1);
    await submeterPesquisa(page);
    await Promise.race([
      page.waitForNetworkIdle({ idleTime: 1000, timeout: 15_000 }).catch(() => undefined),
      aguardar(15_000),
    ]);
    await aguardar(1_000);

    const textos = [await extrairTextoVisivel(page), ...responses];
    const horarios = deduplicar(textos.flatMap((texto) => extrairDoTexto(texto, origem, destino, label)));

    console.log(`[Semiurbano Navegador] Coleta finalizada para ${origem} -> ${destino}: ${horarios.length} horário(s).`);
    return horarios;
  } catch (error) {
    console.error(`[Semiurbano Navegador] Erro ao pesquisar ${origem} -> ${destino}:`, error);
    return [];
  } finally {
    await browser?.close().catch(() => undefined);
  }
}