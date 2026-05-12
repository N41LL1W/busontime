import axios from "axios";
import type { ScrapedHorario } from "../types/scrapers";

export const SEMIURBANO_HORARIOS_URL = "https://semiurbano.lovable.app/horarios";
export const SEMIURBANO_SUPABASE_URL = "https://hmavefxcozimdepdbbon.supabase.co";

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "application/json,text/plain,*/*",
};

type SupabaseConfig = {
  url: string;
  anonKey: string;
};

type SupabaseRow = Record<string, unknown>;

type RouteOptions = {
  origem: string;
  destino: string;
  label?: string;
  supabaseUrl?: string;
  anonKey?: string;
};

const normalizarTexto = (texto: unknown) =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/brodowsky/g, "brodowski")
    .replace(/cachoerinha/g, "cachoeirinha")
    .trim();

const deduplicar = (horarios: ScrapedHorario[]) => {
  const mapa = new Map<string, ScrapedHorario>();

  for (const item of horarios) {
    const chave = `${item.origem}|${item.destino}|${item.diaDaSemana}|${item.horario}`;
    mapa.set(chave, item);
  }

  return Array.from(mapa.values()).sort((a, b) =>
    `${a.origem}|${a.destino}|${a.diaDaSemana}|${a.horario}`.localeCompare(
      `${b.origem}|${b.destino}|${b.diaDaSemana}|${b.horario}`,
      "pt-BR",
    ),
  );
};

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const firstString = (row: SupabaseRow, keys: string[]) => {
  for (const key of keys) {
    const value = asString(row[key]);
    if (value) return value;
  }

  return "";
};

const normalizarHorario = (value: unknown) => {
  const texto = asString(value);
  const match = texto.match(/\b(\d{1,2})\s*(?::|h|H|\.)\s*(\d{2})\b/);
  if (!match) return "";

  const hora = Number(match[1]);
  const minuto = Number(match[2]);
  if (hora < 0 || hora > 23 || minuto < 0 || minuto > 59) return "";

  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
};

const normalizarDiaDaSemana = (value: unknown) => {
  const texto = asString(value);
  const normalizado = normalizarTexto(texto);

  if (!texto) return "Segunda à Sexta";
  if (normalizado.includes("sabado")) return "Sábado";
  if (normalizado.includes("domingo") || normalizado.includes("feriado")) return "Domingo e Feriados";
  if (
    normalizado.includes("segunda") ||
    normalizado.includes("sexta") ||
    normalizado.includes("util") ||
    normalizado.includes("uteis")
  ) {
    return "Segunda à Sexta";
  }

  return texto;
};

const getRowSearchText = (row: SupabaseRow) =>
  Object.values(row)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .map(normalizarTexto)
    .join(" ");

const routeMatches = (route: SupabaseRow, origem: string, destino: string, label?: string) => {
  const routeText = getRowSearchText(route);
  const origemNormalizada = normalizarTexto(origem);
  const destinoNormalizado = normalizarTexto(destino);
  const labelNormalizado = label ? normalizarTexto(label) : "";

  return (
    (routeText.includes(origemNormalizada) && routeText.includes(destinoNormalizado)) ||
    (labelNormalizado.length > 0 && routeText.includes(labelNormalizado))
  );
};

const getRouteId = (route: SupabaseRow) => asString(route.id) || asString(route.rota_id);

const getScheduleId = (schedule: SupabaseRow) => asString(schedule.id) || asString(schedule.horario_id) || asString(schedule.Horario_id);

const getPointScheduleHorarioId = (pointSchedule: SupabaseRow) =>
  asString(pointSchedule.horario_id) || asString(pointSchedule.Horario_id) || asString(pointSchedule.schedule_id);

const getScheduleTime = (schedule: SupabaseRow) =>
  normalizarHorario(
    firstString(schedule, [
      "horario",
      "hora",
      "partida",
      "hora_partida",
      "departure_time",
      "time",
      "saida",
    ]),
  );

const getScheduleDay = (schedule: SupabaseRow) =>
  normalizarDiaDaSemana(
    firstString(schedule, [
      "dia_da_semana",
      "diaDaSemana",
      "dia_semana",
      "dia",
      "tipo_dia",
      "operacao",
      "dias",
    ]),
  );

const getPointTime = (pointSchedule: SupabaseRow) =>
  normalizarHorario(
    firstString(pointSchedule, [
      "arrival_time",
      "horario",
      "hora",
      "tempo",
      "time",
      "previsao",
      "horario_previsto",
    ]),
  );

const getObservation = (schedule: SupabaseRow) => {
  const observacao = firstString(schedule, ["observacao", "obs", "note", "notes", "descricao"]);
  return observacao || "Extraído da API pública do Semiurbano São Bento";
};

async function baixarTexto(url: string) {
  const { data } = await axios.get<string>(url, {
    headers: { ...REQUEST_HEADERS, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    timeout: 30_000,
  });

  return data;
}

function extrairAssets(html: string) {
  const assets = new Set<string>();
  const regex = /<script[^>]+src=["']([^"']+\.js[^"']*)["']/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(html)) !== null) {
    assets.add(new URL(match[1], SEMIURBANO_HORARIOS_URL).toString());
  }

  return Array.from(assets);
}

function extrairConfigSupabase(texto: string): SupabaseConfig | null {
  const supabaseUrl = texto.match(/https:\/\/[a-z0-9]+\.supabase\.co/i)?.[0];
  const anonKey = texto.match(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/)?.[0];

  if (!supabaseUrl || !anonKey) return null;
  return { url: supabaseUrl, anonKey };
}

export async function discoverSemiurbanoSupabaseConfig(): Promise<SupabaseConfig> {
  if (process.env.SEMIURBANO_SUPABASE_URL && process.env.SEMIURBANO_SUPABASE_ANON_KEY) {
    return {
      url: process.env.SEMIURBANO_SUPABASE_URL,
      anonKey: process.env.SEMIURBANO_SUPABASE_ANON_KEY,
    };
  }

  const html = await baixarTexto(SEMIURBANO_HORARIOS_URL);
  const htmlConfig = extrairConfigSupabase(html);
  if (htmlConfig) return htmlConfig;

  for (const assetUrl of extrairAssets(html)) {
    const bundle = await baixarTexto(assetUrl);
    const bundleConfig = extrairConfigSupabase(bundle);
    if (bundleConfig) return bundleConfig;
  }

  throw new Error(
    "Não foi possível descobrir a chave pública anon do Supabase do Semiurbano. Configure SEMIURBANO_SUPABASE_ANON_KEY.",
  );
}

function createSupabaseRestClient(config: SupabaseConfig) {
  const baseUrl = config.url.replace(/\/$/, "");

  return async function getTable<T extends SupabaseRow>(table: string, params: Record<string, string> = {}) {
    const searchParams = new URLSearchParams({ select: "*", offset: "0", limit: "1000", ...params });
    const { data } = await axios.get<T[]>(`${baseUrl}/rest/v1/${table}?${searchParams.toString()}`, {
      headers: {
        ...REQUEST_HEADERS,
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Origin: "https://semiurbano.lovable.app",
        Referer: SEMIURBANO_HORARIOS_URL,
      },
      timeout: 30_000,
    });

    return Array.isArray(data) ? data : [];
  };
}

async function getSchedulesForRoute(
  getTable: ReturnType<typeof createSupabaseRestClient>,
  routeId: string,
  origem: string,
  destino: string,
) {
  const schedules = await getTable("horarios", { rota_id: `eq.${routeId}` });
  const pontos = await getTable("pontos", { order: "sort_order.asc", rota_id: `eq.${routeId}` }).catch(() => []);
  const originPoint = pontos.find((ponto) => getRowSearchText(ponto).includes(normalizarTexto(origem)));

  const pointSchedules = originPoint
    ? await getTable("pontos_horarios", { ponto_id: `eq.${asString(originPoint.id)}` }).catch(() => [])
    : [];
  const pointScheduleByScheduleId = new Map(pointSchedules.map((item) => [getPointScheduleHorarioId(item), item]));

  return schedules.flatMap((schedule): ScrapedHorario[] => {
    const horarioId = getScheduleId(schedule);
    const pointTime = horarioId ? getPointTime(pointScheduleByScheduleId.get(horarioId) ?? {}) : "";
    const horario = pointTime || getScheduleTime(schedule);

    if (!horario) return [];

    return [
      {
        origem,
        destino,
        diaDaSemana: getScheduleDay(schedule),
        horario,
        tarifa: null,
        observacao: getObservation(schedule),
      },
    ];
  });
}

export async function scrapeSemiurbanoSupabaseRoute({
  origem,
  destino,
  label,
  supabaseUrl,
  anonKey,
}: RouteOptions): Promise<ScrapedHorario[]> {
  console.log(`[Semiurbano Supabase] Iniciando coleta para ${origem} -> ${destino}`);

  try {
    const config = anonKey
      ? { url: supabaseUrl ?? SEMIURBANO_SUPABASE_URL, anonKey }
      : await discoverSemiurbanoSupabaseConfig();
    const getTable = createSupabaseRestClient(config);
    const routes = await getTable("rotas");
    const matchingRoutes = routes.filter((route) => routeMatches(route, origem, destino, label));

    if (!matchingRoutes.length) {
      console.warn(`[Semiurbano Supabase] Nenhuma rota encontrada para ${origem} -> ${destino}.`);
      return [];
    }

    const horarios = deduplicar(
      (
        await Promise.all(
          matchingRoutes
            .map(getRouteId)
            .filter(Boolean)
            .map((routeId) => getSchedulesForRoute(getTable, routeId, origem, destino)),
        )
      ).flat(),
    );

    console.log(`[Semiurbano Supabase] Coleta finalizada para ${origem} -> ${destino}: ${horarios.length} horário(s).`);
    return horarios;
  } catch (error) {
    console.error(`[Semiurbano Supabase] Erro ao coletar ${origem} -> ${destino}:`, error);
    return [];
  }
}