import axios from "axios";
import * as cheerio from "cheerio";
import type { ScrapedHorario } from "../types/scrapers";

const DEFAULT_SOURCE_URL = "https://semiurbano.lovable.app/horarios";
const USER_AGENT =
  "Mozilla/5.0 (compatible; BusOnTimeScraper/1.0; +https://busontime.app)";

type UnknownRecord = Record<string, unknown>;

type SupabaseConfig = {
  anonKey: string;
  tableNames: string[];
  url: string;
};

const http = axios.create({
  timeout: 30000,
  headers: {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "User-Agent": USER_AGENT,
  },
});

const apiHttp = axios.create({
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "User-Agent": USER_AGENT,
  },
});

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function compactText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value)
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:])/g, "$1")
    .trim();

  return text || null;
}

function normalizarCidade(value: unknown): string | null {
  const text = compactText(value);
  if (!text) return null;

  return text
    .replace(/\s*-\s*SP$/i, "")
    .replace(/^terminal\s+/i, "")
    .trim();
}

function normalizarDiaDaSemana(value: unknown): string {
  const text = compactText(value);
  if (!text) return "Todos os dias";

  const normalized = text
    .replace(/_/g, " ")
    .replace(/\bseg\b/gi, "Segunda")
    .replace(/\bsex\b/gi, "Sexta")
    .replace(/\bsab\b/gi, "Sábado")
    .replace(/\bdom\b/gi, "Domingo")
    .replace(/uteis|úteis/gi, "úteis")
    .trim();

  if (/segunda.*sexta|seg.*sex|dias úteis|dias uteis/i.test(normalized)) {
    return "Segunda à Sexta";
  }

  if (/s[aá]bado.*domingo|fim de semana/i.test(normalized)) {
    return "Sábado, Domingo e Feriados";
  }

  if (/domingo|feriado/i.test(normalized) && !/s[aá]bado/i.test(normalized)) {
    return "Domingo e Feriados";
  }

  if (/s[aá]bado/i.test(normalized) && !/domingo/i.test(normalized)) {
    return "Sábado";
  }

  return normalized;
}

function normalizarHorario(value: unknown): string | null {
  const text = compactText(value);
  if (!text) return null;

  const match = text.match(/\b([0-2]?\d)\s*[:hH]\s*([0-5]\d)\b|\b([0-2]?\d)\s*h\b/i);
  if (!match) return null;

  const hours = Number(match[1] ?? match[3]);
  const minutes = Number(match[2] ?? 0);

  if (hours > 23 || minutes > 59) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizarTarifa(value: unknown): number | null {
  const text = compactText(value);
  if (!text) return null;

  const match = text.match(/\d+(?:[,.]\d{1,2})?/);
  if (!match) return null;

  const parsed = Number(match[0].replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function pick(record: UnknownRecord, keys: string[]): unknown {
  const foundKey = Object.keys(record).find((key) =>
    keys.some((candidate) => candidate.toLowerCase() === key.toLowerCase()),
  );

  return foundKey ? record[foundKey] : undefined;
}

function splitRota(value: unknown): { origem: string | null; destino: string | null } {
  const text = compactText(value);
  if (!text) return { origem: null, destino: null };

  const parts = text.split(/\s*(?:→|->| x | X | - )\s*/).map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return { origem: null, destino: null };

  return {
    origem: normalizarCidade(parts[0]),
    destino: normalizarCidade(parts.slice(1).join(" - ")),
  };
}

function buildObservation(record: UnknownRecord): string | null {
  const candidates = [
    pick(record, ["observacao", "observação", "obs", "note", "notes"]),
    pick(record, ["tipo", "categoria", "servico", "serviço", "modalidade"]),
    pick(record, ["linha", "numero_linha", "linha_numero", "codigo", "código"]),
  ]
    .map(compactText)
    .filter(Boolean) as string[];

  return unique(candidates).join(" | ") || null;
}

function getRouteContext(record: UnknownRecord): Pick<ScrapedHorario, "origem" | "destino"> | null {
  const route = splitRota(
    pick(record, ["rota", "trajeto", "itinerario", "itinerário", "descricao", "descrição", "nome"]),
  );
  const origem =
    normalizarCidade(pick(record, ["origem", "cidade_origem", "origin", "from", "saida", "saída"])) ?? route.origem;
  const destino =
    normalizarCidade(pick(record, ["destino", "cidade_destino", "destination", "to", "chegada"])) ?? route.destino;

  return origem && destino ? { origem, destino } : null;
}

function rowToHorario(record: UnknownRecord, inherited: Partial<ScrapedHorario> = {}): ScrapedHorario | null {
  const context = getRouteContext(record);
  const origem = context?.origem ?? inherited.origem ?? null;
  const destino = context?.destino ?? inherited.destino ?? null;
  const horario = normalizarHorario(
    pick(record, ["horario", "horário", "hora", "partida", "saida", "saída", "departure_time", "time"]),
  );

  if (!origem || !destino || !horario) return null;

  return {
    origem,
    destino,
    horario,
    diaDaSemana: normalizarDiaDaSemana(
      pick(record, ["diaDaSemana", "dia_da_semana", "dia", "dias", "tipo_dia", "periodo", "período"]),
    ),
    tarifa: normalizarTarifa(pick(record, ["tarifa", "valor", "preco", "preço", "price"])),
    observacao: buildObservation(record),
  };
}

function extractScriptUrls(html: string, pageUrl: string): string[] {
  const $ = cheerio.load(html);
  return unique(
    $("script[src]")
      .map((_, element) => $(element).attr("src"))
      .get()
      .filter(Boolean)
      .map((src) => new URL(src, pageUrl).toString()),
  );
}

function extractSupabaseConfig(bundleText: string): SupabaseConfig | null {
  const url = bundleText.match(/https:\/\/[a-z0-9-]+\.supabase\.co/i)?.[0];
  const anonKey = bundleText.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/)?.[0];

  if (!url || !anonKey) return null;

  const fromMatches = Array.from(bundleText.matchAll(/\.from\(\s*["'`]([^"'`]+)["'`]\s*\)/g)).map(
    (match) => match[1],
  );
  const tableNames = unique([
    ...fromMatches,
    "horarios",
    "schedules",
    "linhas",
    "rotas",
    "routes",
    "itinerarios",
  ]);

  return { url, anonKey, tableNames };
}

async function fetchSupabaseRows(config: SupabaseConfig): Promise<UnknownRecord[]> {
  const rows: UnknownRecord[] = [];

  for (const tableName of config.tableNames) {
    try {
      const { data } = await apiHttp.get(`${config.url}/rest/v1/${tableName}`, {
        params: { select: "*" },
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`,
        },
      });

      if (Array.isArray(data) && data.length > 0) {
        console.log(`[Semiurbano São Bento] ${data.length} registro(s) carregado(s) da tabela '${tableName}'.`);
        rows.push(...data.filter((item): item is UnknownRecord => typeof item === "object" && item !== null));
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status && [401, 403, 404].includes(error.response.status)) {
        continue;
      }
      console.warn(`[Semiurbano São Bento] Falha ao consultar tabela '${tableName}'.`, error);
    }
  }

  return rows;
}

function parseEmbeddedRows(bundleText: string): UnknownRecord[] {
  const rows: UnknownRecord[] = [];
  const objectMatches = bundleText.match(/\{[^{}]*(?:origem|destino|horario|horário|rota|trajeto)[^{}]*\}/gi) ?? [];

  for (const objectText of objectMatches) {
    try {
      const jsonLike = objectText
        .replace(/([{,])\s*([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
        .replace(/'/g, '"');
      const parsed = JSON.parse(jsonLike);
      if (parsed && typeof parsed === "object") rows.push(parsed);
    } catch {
      // Bundle minificado pode ter objetos com expressões. Esses casos são ignorados.
    }
  }

  return rows;
}

function expandRows(rows: UnknownRecord[]): ScrapedHorario[] {
  const horarios: ScrapedHorario[] = [];

  for (const row of rows) {
    const direct = rowToHorario(row);
    if (direct) horarios.push(direct);

    const nestedCandidates = [
      pick(row, ["horarios", "horários", "schedules", "times", "partidas"]),
      pick(row, ["dias", "days", "quadros"]),
    ];

    for (const nested of nestedCandidates) {
      if (!Array.isArray(nested)) continue;

      for (const nestedItem of nested) {
        if (typeof nestedItem === "string") {
          const horario = rowToHorario({ ...row, horario: nestedItem });
          if (horario) horarios.push(horario);
        } else if (nestedItem && typeof nestedItem === "object") {
          const horario = rowToHorario(nestedItem as UnknownRecord, direct ?? getRouteContext(row) ?? undefined);
          if (horario) horarios.push(horario);
        }
      }
    }
  }

  const seen = new Set<string>();
  return horarios.filter((item) => {
    const key = `${item.origem}|${item.destino}|${item.diaDaSemana}|${item.horario}|${item.observacao ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function scrapeSemiurbanoSaoBento(sourceUrl = DEFAULT_SOURCE_URL): Promise<ScrapedHorario[]> {
  console.log(`[Semiurbano São Bento] Iniciando raspagem completa em ${sourceUrl}`);

  const { data: html } = await http.get<string>(sourceUrl);
  const scriptUrls = extractScriptUrls(html, sourceUrl);

  if (scriptUrls.length === 0) {
    throw new Error("Nenhum bundle JavaScript encontrado na página do Semiurbano São Bento.");
  }

  const bundles = await Promise.all(
    scriptUrls.map(async (scriptUrl) => {
      const { data } = await http.get<string>(scriptUrl, { headers: { Accept: "application/javascript,*/*" } });
      return data;
    }),
  );
  const bundleText = bundles.join("\n");
  const config = extractSupabaseConfig(bundleText);

  const rows = config ? await fetchSupabaseRows(config) : [];
  const sourceRows = rows.length > 0 ? rows : parseEmbeddedRows(bundleText);
  const horarios = expandRows(sourceRows);

  if (horarios.length === 0) {
    throw new Error(
      "Não foi possível normalizar horários do Semiurbano São Bento. Confirme o endpoint/tabela visto no Network do F12.",
    );
  }

  console.log(`[Semiurbano São Bento] Raspagem finalizada com ${horarios.length} horário(s).`);
  return horarios;
}
