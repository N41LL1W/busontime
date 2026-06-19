"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { format, isBefore, startOfToday, differenceInMinutes } from "date-fns";
import { CalendarIcon, ClockIcon, FilterX, LinkIcon, ArrowLeftRight, Clock, Bus, MapPin } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SourceModal from "./SourceModal";
import type { HorarioFlat } from "@/pages/index";

interface BusScheduleFilterProps {
  schedules: HorarioFlat[];
  rotasMapa?: Record<string, string[]>;
}

const getDiaDaSemana = (date: Date): string => {
  const dia = date.getDay();
  if (dia === 0) return "Domingo e Feriados";
  if (dia === 6) return "Sábado";
  return "Segunda a Sexta";
};

const formatTarifa = (valor: number | null) =>
  valor != null ? `R$ ${valor.toFixed(2).replace(".", ",")}` : null;

const tempoAte = (horario: string): string => {
  const [h, m] = horario.split(":").map(Number);
  const agora = new Date();
  const alvo = new Date(agora);
  alvo.setHours(h, m, 0, 0);
  if (alvo <= agora) alvo.setDate(alvo.getDate() + 1);
  const diff = differenceInMinutes(alvo, agora);
  if (diff < 1) return "agora";
  if (diff < 60) return `${diff} min`;
  const horas = Math.floor(diff / 60);
  const mins = diff % 60;
  return mins > 0 ? `${horas}h ${mins}min` : `${horas}h`;
};

const INITIAL_DATE = new Date(2000, 0, 1);
const INITIAL_TIME = "00:00";

// Badge de empresa com cor por empresa
const empresaCor: Record<string, string> = {
  "Viação São Bento": "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
  "Ribe Transporte": "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
  "Rápido d'Oeste": "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
};

function slugify(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function BusScheduleFilter({ schedules, rotasMapa }: BusScheduleFilterProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(INITIAL_DATE);
  const [selectedTime, setSelectedTime] = useState(INITIAL_TIME);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [agora, setAgora] = useState(new Date());
  const itensPorPagina = 12;

  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const resetParaAgora = useCallback(() => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
  }, []);

  const isHoje = isHydrated
    ? format(selectedDate, "yyyy-MM-dd") === format(agora, "yyyy-MM-dd")
    : false;

  const destinosPorOrigem = useMemo(() => {
    if (!rotasMapa || !origin) return null;
    return rotasMapa[origin] ?? [];
  }, [rotasMapa, origin]);

  const { filteredSchedules, availableOrigins, availableDestinations } = useMemo(() => {
    const diaDaSemana = getDiaDaSemana(selectedDate);

    let base = schedules.filter((s) => {
      if (s.sentido !== "ida") return false;
      const diaOk = s.diaDaSemana === diaDaSemana;
      if (isHoje) return diaOk && s.horario >= selectedTime;
      return diaOk;
    });

    const origensDisponiveis = Array.from(new Set(base.map((s) => s.origem))).sort();
    let destinosDisponiveis = Array.from(new Set(base.map((s) => s.destino))).sort();

    let filtered = [...base];
    let finalOrigens = origensDisponiveis;
    let finalDestinos = destinosPorOrigem ?? destinosDisponiveis;

    if (origin) {
      filtered = filtered.filter((s) => s.origem === origin);
      if (!destinosPorOrigem) finalDestinos = Array.from(new Set(filtered.map((s) => s.destino))).sort();
    }
    if (destination) {
      filtered = filtered.filter((s) => s.destino === destination);
      if (!origin) finalOrigens = Array.from(new Set(filtered.map((s) => s.origem))).sort();
    }

    filtered.sort((a, b) => a.horario.localeCompare(b.horario));

    return {
      filteredSchedules: filtered,
      availableOrigins: finalOrigens,
      availableDestinations: finalDestinos,
    };
  }, [schedules, selectedDate, selectedTime, isHoje, origin, destination, destinosPorOrigem]);

  useEffect(() => {
    if (destination && !availableDestinations.includes(destination)) setDestination("");
  }, [availableDestinations, destination]);

  useEffect(() => { setCurrentPage(1); }, [filteredSchedules]);

  const totalPages = Math.ceil(filteredSchedules.length / itensPorPagina);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itensPorPagina,
    currentPage * itensPorPagina
  );

  const proximoHorario = filteredSchedules[0] ?? null;

  const rotaInfo = useMemo(() => {
    if (!origin || !destination || !filteredSchedules.length) return null;
    const s = filteredSchedules[0];
    return {
      linha: s.linha,
      tarifaComum: s.tarifaComum,
      tarifaEstudante: s.tarifaEstudante,
      empresa: s.empresaNome,
    };
  }, [filteredSchedules, origin, destination]);

  const handleClear = () => { resetParaAgora(); setOrigin(""); setDestination(""); };
  const handleSwap = () => { setOrigin(destination); setDestination(origin); };

  return (
    <>
      <div className="space-y-4">
        {/* ── Filtros ── */}
        <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Data + Hora */}
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal text-sm h-10">
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    {isHydrated ? format(selectedDate, "EEE, dd/MM") : "—"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    disabled={(date) => isBefore(date, startOfToday())}
                  />
                </PopoverContent>
              </Popover>

              <div className="relative w-32 shrink-0">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={resetParaAgora}
                title="Hora atual"
                className="shrink-0 px-2 h-10"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>

            {/* Origem ⇄ Destino */}
            <div className="flex items-center gap-2">
              <Select value={origin} onValueChange={(v) => { setOrigin(v); setDestination(""); }}>
                <SelectTrigger className="flex-1 h-10 text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 text-primary" />
                  <SelectValue placeholder="De onde?" />
                </SelectTrigger>
                <SelectContent>
                  {availableOrigins.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSwap}
                disabled={!origin && !destination}
                className="shrink-0 rounded-full px-2 h-10 border-primary/30"
              >
                <ArrowLeftRight className="h-4 w-4 text-primary" />
              </Button>

              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="flex-1 h-10 text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Para onde?" />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Linha de info + limpar */}
            <div className="flex items-center justify-between gap-2">
              {rotaInfo ? (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium text-foreground truncate max-w-[200px]">
                    {rotaInfo.linha ?? `${origin} → ${destination}`}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 font-medium ${empresaCor[rotaInfo.empresa] ?? "bg-muted text-muted-foreground"}`}>
                    {rotaInfo.empresa}
                  </span>
                  {rotaInfo.tarifaComum && (
                    <span className="text-muted-foreground">
                      {formatTarifa(rotaInfo.tarifaComum)}
                      {rotaInfo.tarifaEstudante && (
                        <span className="text-green-600 dark:text-green-400"> · Estudante {formatTarifa(rotaInfo.tarifaEstudante)}</span>
                      )}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {filteredSchedules.length} horário{filteredSchedules.length !== 1 ? "s" : ""}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {filteredSchedules.length > 0
                    ? `${filteredSchedules.length} horários disponíveis`
                    : "Selecione origem e destino"}
                </span>
              )}
              <Button variant="ghost" size="sm" onClick={handleClear} className="shrink-0 text-destructive hover:text-destructive h-8 px-2">
                <FilterX className="h-4 w-4" />
              </Button>
            </div>

            {/* Link para página completa da rota */}
            {origin && destination && (
              <Link
                href={`/rota/${slugify(origin)}-ate-${slugify(destination)}`}
                className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
              >
                <span>📋 Ver página completa desta rota</span>
                <span className="opacity-60">→</span>
              </Link>
            )}
          </div>
        </div>

        {/* ── Próximo ônibus ── */}
        {proximoHorario && isHoje && (
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 dark:bg-primary/10 p-4 flex items-center gap-4">
            <div className="shrink-0 flex flex-col items-center">
              <span className="text-4xl font-bold tabular-nums text-primary leading-none">
                {proximoHorario.horario}
              </span>
              <span className="text-xs font-medium text-primary/70 mt-1">
                em {tempoAte(proximoHorario.horario)}
              </span>
            </div>
            <div className="flex-1 min-w-0 border-l border-primary/20 pl-4">
              <p className="text-sm font-semibold text-foreground truncate">
                {proximoHorario.origem} → {proximoHorario.destino}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${empresaCor[proximoHorario.empresaNome] ?? "bg-muted text-muted-foreground"}`}>
                  {proximoHorario.empresaNome}
                </span>
                {proximoHorario.tipo === "intermediario" && (
                  <span className="rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    ponto intermediário
                  </span>
                )}
                {proximoHorario.tarifaComum && (
                  <span className="text-xs text-muted-foreground">{formatTarifa(proximoHorario.tarifaComum)}</span>
                )}
              </div>
            </div>
            {proximoHorario.sourceUrl && (
              <button
                onClick={() => setModalUrl(proximoHorario.sourceUrl!)}
                className="shrink-0 p-2 text-muted-foreground hover:text-primary rounded-full"
              >
                <LinkIcon size={14} />
              </button>
            )}
          </div>
        )}

        {/* ── Resultados ── */}
        {paginatedSchedules.length > 0 ? (
          <>
            {/* Tabela — md+ */}
            <div className="hidden md:block rounded-2xl border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium w-28">Horário</th>
                    <th className="px-4 py-3 text-left font-medium">Origem → Destino</th>
                    {!origin && !destination && (
                      <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Dia</th>
                    )}
                    <th className="px-4 py-3 text-left font-medium">Empresa</th>
                    <th className="px-4 py-3 text-left font-medium">Saída</th>
                    <th className="px-4 py-3 text-left font-medium">Tarifa</th>
                    <th className="px-4 py-3 text-right font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedSchedules.map((s, idx) => {
                    const isProximo = idx === 0 && currentPage === 1 && isHoje;
                    return (
                      <tr key={s.id} className={`hover:bg-muted/30 transition-colors ${isProximo ? "bg-primary/5" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-base font-bold tabular-nums ${isProximo ? "text-primary" : "text-foreground"}`}>
                              {s.horario}
                            </span>
                            {isProximo && isHoje && (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary whitespace-nowrap">
                                {tempoAte(s.horario)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">
                          {s.origem} <span className="text-muted-foreground font-normal">→</span> {s.destino}
                        </td>
                        {!origin && !destination && (
                          <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{s.diaDaSemana}</td>
                        )}
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${empresaCor[s.empresaNome] ?? "bg-muted text-muted-foreground"}`}>
                            {s.empresaNome}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {s.tipo === "intermediario" ? (
                            <span className="rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              ponto
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">rodoviária</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                          {formatTarifa(s.tarifaComum) ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {s.sourceUrl && (
                            <button
                              onClick={() => setModalUrl(s.sourceUrl!)}
                              className="p-1.5 text-muted-foreground/50 hover:text-primary rounded-full transition-colors"
                            >
                              <LinkIcon size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cards — mobile */}
            <div className="flex flex-col gap-2 md:hidden">
              {paginatedSchedules.map((s, idx) => {
                const isProximo = idx === 0 && currentPage === 1 && isHoje;
                return (
                  <div
                    key={s.id}
                    className={`rounded-xl border p-3.5 flex items-center gap-3 ${isProximo ? "border-primary/40 bg-primary/5" : "bg-card"}`}
                  >
                    {/* Horário */}
                    <div className="shrink-0 text-center w-16">
                      <div className={`text-2xl font-bold tabular-nums leading-none ${isProximo ? "text-primary" : "text-foreground"}`}>
                        {s.horario}
                      </div>
                      {isProximo && isHoje && (
                        <div className="text-[10px] text-primary font-medium mt-0.5">{tempoAte(s.horario)}</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 border-l pl-3">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {s.origem} → {s.destino}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className={`rounded-full px-1.5 py-0 text-[11px] font-medium ${empresaCor[s.empresaNome] ?? "bg-muted text-muted-foreground"}`}>
                          {s.empresaNome}
                        </span>
                        {s.tipo === "intermediario" && (
                          <span className="rounded-full px-1.5 py-0 text-[11px] bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                            ponto
                          </span>
                        )}
                        {s.tarifaComum && (
                          <span className="text-[11px] text-muted-foreground">{formatTarifa(s.tarifaComum)}</span>
                        )}
                      </div>
                    </div>

                    {s.sourceUrl && (
                      <button
                        onClick={() => setModalUrl(s.sourceUrl!)}
                        className="shrink-0 p-1.5 text-muted-foreground/40 hover:text-primary rounded-full"
                      >
                        <LinkIcon size={13} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 py-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                  ← Anterior
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {currentPage} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                  Próximo →
                </Button>
              </div>
            )}
          </>
        ) : isHydrated ? (
          <div className="rounded-2xl border-2 border-dashed bg-card p-10 text-center">
            <Bus className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">
              {origin || destination
                ? "Nenhum horário disponível para esta rota agora."
                : "Selecione origem e destino para ver os horários."}
            </p>
            {(origin || destination) && (
              <p className="text-sm text-muted-foreground mt-1">
                Tente outra data ou remova os filtros.
              </p>
            )}
          </div>
        ) : null}
      </div>

      {modalUrl && <SourceModal url={modalUrl} onClose={() => setModalUrl(null)} />}
    </>
  );
}