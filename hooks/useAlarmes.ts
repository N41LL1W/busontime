"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export type Intervalo = 60 | 30 | 15 | 5;

export type Alarme = {
  id: string;
  horario: string;
  origem: string;
  destino: string;
  empresa: string;
  data: string;
  intervalos: Intervalo[];
  criadoEm: number;
};

const STORAGE_KEY = "busontime:alarmes";

function gerarId(horario: string, origem: string, destino: string, data: string) {
  return `${data}-${horario}-${origem}-${destino}`.replace(/\s+/g, "_");
}

function calcularMs(horario: string, data: string, minutosAntes: number): number {
  const [h, m] = horario.split(":").map(Number);
  const alvo = new Date(`${data}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  alvo.setMinutes(alvo.getMinutes() - minutosAntes);
  return alvo.getTime();
}

function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

// ── Estado GLOBAL fora do React ──────────────────────────────────────────
// Isso é o que corrige o bug: os timers e a lista de alarmes vivem no módulo,
// não dentro de um componente. Navegar entre páginas (SPA) NÃO os destrói,
// pois o módulo continua carregado enquanto a aba estiver aberta.
let alarmesGlobais: Alarme[] = [];
const timersGlobais = new Map<string, ReturnType<typeof setTimeout>[]>();
const listeners = new Set<() => void>();
let inicializado = false;

function notificarListeners() {
  listeners.forEach((fn) => fn());
}

function persistir() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarmesGlobais));
  } catch { /* ignora */ }
}

function agendarTimers(alarme: Alarme) {
  // Cancela timers antigos deste alarme específico (não mexe nos outros)
  const antigos = timersGlobais.get(alarme.id);
  if (antigos) antigos.forEach(clearTimeout);

  const timers: ReturnType<typeof setTimeout>[] = [];
  const agora = Date.now();

  for (const minutos of alarme.intervalos) {
    const dispararEm = calcularMs(alarme.horario, alarme.data, minutos);
    const delay = dispararEm - agora;

    if (delay > 0) {
      const timer = setTimeout(() => {
        if ("Notification" in window && Notification.permission === "granted") {
          const minutosNum = Number(minutos);
          const titulo = minutosNum <= 0
            ? "🚌 Seu ônibus está saindo agora!"
            : `🚌 Ônibus em ${minutosNum} minuto${minutosNum !== 1 ? "s" : ""}`;

          try {
            const n = new Notification(titulo, {
              body: `${alarme.origem} → ${alarme.destino} às ${alarme.horario} · ${alarme.empresa}`,
              icon: "/favicon.svg",
              tag: `${alarme.id}-${minutos}`,
              requireInteraction: minutosNum <= 5,
            });
            n.onclick = () => window.focus();
          } catch (err) {
            console.error("Erro ao criar notificação:", err);
          }
        }
      }, delay);
      timers.push(timer);
    }
  }

  timersGlobais.set(alarme.id, timers);
}

function inicializar() {
  if (inicializado || typeof window === "undefined") return;
  inicializado = true;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: Alarme[] = JSON.parse(raw);
      const hoje = dataHoje();
      alarmesGlobais = parsed.filter((a) => a.data >= hoje);
      if (alarmesGlobais.length !== parsed.length) persistir();
    }
  } catch { /* ignora */ }

  // Reagenda tudo que já estava salvo, se a permissão já foi concedida antes
  if ("Notification" in window && Notification.permission === "granted") {
    alarmesGlobais.forEach(agendarTimers);
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot() {
  return alarmesGlobais;
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useAlarmes() {
  const alarmes = useSyncExternalStore(subscribe, getSnapshot, () => []);
  const [permissao, setPermissao] = useState<NotificationPermission>("default");

  useEffect(() => {
    inicializar();
    if ("Notification" in window) setPermissao(Notification.permission);
  }, []);

  const solicitarPermissao = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const resultado = await Notification.requestPermission();
    setPermissao(resultado);
    if (resultado === "granted") {
      // Agenda tudo que já estava pendente assim que a permissão for concedida
      alarmesGlobais.forEach(agendarTimers);
    }
    return resultado === "granted";
  }, []);

  const adicionarAlarme = useCallback(async (params: {
    horario: string;
    origem: string;
    destino: string;
    empresa: string;
    data?: string;
    intervalos?: Intervalo[];
  }) => {
    let perm: NotificationPermission = ("Notification" in window) ? Notification.permission : "denied";
    if (perm !== "granted") {
      const ok = await solicitarPermissao();
      if (!ok) return false;
    }

    const data = params.data ?? dataHoje();
    const intervalos = params.intervalos ?? [30, 15, 5];
    const novoAlarme: Alarme = {
      id: gerarId(params.horario, params.origem, params.destino, data),
      horario: params.horario,
      origem: params.origem,
      destino: params.destino,
      empresa: params.empresa,
      data,
      intervalos,
      criadoEm: Date.now(),
    };

    alarmesGlobais = [...alarmesGlobais.filter((a) => a.id !== novoAlarme.id), novoAlarme];
    persistir();
    agendarTimers(novoAlarme);
    notificarListeners();
    return true;
  }, [solicitarPermissao]);

  const removerAlarme = useCallback((id: string) => {
    const timers = timersGlobais.get(id);
    if (timers) { timers.forEach(clearTimeout); timersGlobais.delete(id); }
    alarmesGlobais = alarmesGlobais.filter((a) => a.id !== id);
    persistir();
    notificarListeners();
  }, []);

  const atualizarIntervalos = useCallback((id: string, intervalos: Intervalo[]) => {
    alarmesGlobais = alarmesGlobais.map((a) => {
      if (a.id !== id) return a;
      const atualizado = { ...a, intervalos };
      agendarTimers(atualizado);
      return atualizado;
    });
    persistir();
    notificarListeners();
  }, []);

  const temAlarme = useCallback((horario: string, origem: string, destino: string) => {
    const hoje = dataHoje();
    return alarmes.some((a) => a.horario === horario && a.origem === origem && a.destino === destino && a.data >= hoje);
  }, [alarmes]);

  const getAlarme = useCallback((horario: string, origem: string, destino: string) => {
    const hoje = dataHoje();
    return alarmes.find((a) => a.horario === horario && a.origem === origem && a.destino === destino && a.data >= hoje) ?? null;
  }, [alarmes]);

  return {
    alarmes,
    permissao,
    adicionarAlarme,
    removerAlarme,
    atualizarIntervalos,
    temAlarme,
    getAlarme,
    solicitarPermissao,
  };
}