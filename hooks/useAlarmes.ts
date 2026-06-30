"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ── Tipos ────────────────────────────────────────────────────────────────
export type Intervalo = 60 | 30 | 15 | 5;

export type Alarme = {
  id: string;
  horario: string;       // "07:10"
  origem: string;
  destino: string;
  empresa: string;
  data: string;          // "2026-06-26" (YYYY-MM-DD)
  intervalos: Intervalo[]; // [60, 30, 15, 5]
  criadoEm: number;
};

const STORAGE_KEY = "busontime:alarmes";
const INTERVALOS_PADRAO: Intervalo[] = [30, 15, 5];

// ── Helpers ──────────────────────────────────────────────────────────────
function gerarId(alarme: Omit<Alarme, "id" | "criadoEm">) {
  return `${alarme.data}-${alarme.horario}-${alarme.origem}-${alarme.destino}`;
}

function calcularMs(horario: string, data: string, minutosAntes: number): number {
  const [h, m] = horario.split(":").map(Number);
  const alvo = new Date(`${data}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`);
  alvo.setMinutes(alvo.getMinutes() - minutosAntes);
  return alvo.getTime();
}

function formatarHorario(horario: string) {
  return horario;
}

function dataHoje() {
  return new Date().toISOString().slice(0, 10);
}

// ── Hook principal ────────────────────────────────────────────────────────
export function useAlarmes() {
  const [alarmes, setAlarmes] = useState<Alarme[]>([]);
  const [permissao, setPermissao] = useState<NotificationPermission>("default");
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>[]>>(new Map());

  // Carrega do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Alarme[] = JSON.parse(raw);
        // Remove alarmes de dias passados
        const hoje = dataHoje();
        const ativos = parsed.filter((a) => a.data >= hoje);
        setAlarmes(ativos);
        if (ativos.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(ativos));
        }
      }
    } catch {
      // ignora erro de parse
    }

    // Verifica permissão atual
    if ("Notification" in window) {
      setPermissao(Notification.permission);
    }
  }, []);

  // Salva no localStorage quando alarmes mudam
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarmes));
  }, [alarmes]);

  // Agenda os timers para cada alarme ativo
  const agendarTimers = useCallback((alarme: Alarme) => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const agora = Date.now();

    for (const minutos of alarme.intervalos) {
      const dispararEm = calcularMs(alarme.horario, alarme.data, minutos);
      const delay = dispararEm - agora;

      if (delay > 0) {
        const timer = setTimeout(() => {
          if ("Notification" in window && Notification.permission === "granted") {
            const titulo = minutos === 0
              ? `🚌 Seu ônibus está saindo agora!`
              : `🚌 Ônibus em ${minutos} minuto${minutos !== 1 ? "s" : ""}`;

            new Notification(titulo, {
              body: `${alarme.origem} → ${alarme.destino} às ${formatarHorario(alarme.horario)} · ${alarme.empresa}`,
              icon: "/favicon.svg",
              tag: `${alarme.id}-${minutos}`,
              requireInteraction: minutos <= 5,
            });
          }
        }, delay);

        timers.push(timer);
      }
    }

    timersRef.current.set(alarme.id, timers);
  }, []);

  // Reagenda todos os alarmes ao montar
  useEffect(() => {
    if (permissao === "granted") {
      alarmes.forEach(agendarTimers);
    }
    return () => {
      // Limpa todos os timers ao desmontar
      timersRef.current.forEach((timers) => timers.forEach(clearTimeout));
    };
  }, [permissao]); // eslint-disable-line react-hooks/exhaustive-deps

  // Solicita permissão de notificação
  const solicitarPermissao = useCallback(async () => {
    if (!("Notification" in window)) return false;
    const resultado = await Notification.requestPermission();
    setPermissao(resultado);
    return resultado === "granted";
  }, []);

  // Adiciona ou atualiza alarme
  const adicionarAlarme = useCallback(async (
    params: {
      horario: string;
      origem: string;
      destino: string;
      empresa: string;
      data?: string;
      intervalos?: Intervalo[];
    }
  ) => {
    let perm = permissao;
    if (perm !== "granted") {
      const ok = await solicitarPermissao();
      if (!ok) return false;
      perm = "granted";
    }

    const novoAlarme: Alarme = {
      id: gerarId({
        horario: params.horario,
        origem: params.origem,
        destino: params.destino,
        empresa: params.empresa,
        data: params.data ?? dataHoje(),
        intervalos: params.intervalos ?? INTERVALOS_PADRAO,
      }),
      horario: params.horario,
      origem: params.origem,
      destino: params.destino,
      empresa: params.empresa,
      data: params.data ?? dataHoje(),
      intervalos: params.intervalos ?? INTERVALOS_PADRAO,
      criadoEm: Date.now(),
    };

    // Remove timers antigos do mesmo alarme se existir
    const timersAntigos = timersRef.current.get(novoAlarme.id);
    if (timersAntigos) timersAntigos.forEach(clearTimeout);

    setAlarmes((prev) => {
      const filtrado = prev.filter((a) => a.id !== novoAlarme.id);
      return [...filtrado, novoAlarme];
    });

    agendarTimers(novoAlarme);
    return true;
  }, [permissao, solicitarPermissao, agendarTimers]);

  // Remove alarme
  const removerAlarme = useCallback((id: string) => {
    const timers = timersRef.current.get(id);
    if (timers) {
      timers.forEach(clearTimeout);
      timersRef.current.delete(id);
    }
    setAlarmes((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // Atualiza intervalos de um alarme existente
  const atualizarIntervalos = useCallback((id: string, intervalos: Intervalo[]) => {
    setAlarmes((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const atualizado = { ...a, intervalos };
        // Reagenda
        const timersAntigos = timersRef.current.get(id);
        if (timersAntigos) timersAntigos.forEach(clearTimeout);
        agendarTimers(atualizado);
        return atualizado;
      })
    );
  }, [agendarTimers]);

  // Verifica se um horário tem alarme ativo
  const temAlarme = useCallback((horario: string, origem: string, destino: string) => {
    const hoje = dataHoje();
    return alarmes.some(
      (a) => a.horario === horario && a.origem === origem && a.destino === destino && a.data >= hoje
    );
  }, [alarmes]);

  const getAlarme = useCallback((horario: string, origem: string, destino: string) => {
    const hoje = dataHoje();
    return alarmes.find(
      (a) => a.horario === horario && a.origem === origem && a.destino === destino && a.data >= hoje
    ) ?? null;
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
    INTERVALOS_PADRAO,
  };
}