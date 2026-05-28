"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { format, isBefore, startOfToday, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ClockIcon, FilterX, LinkIcon, ArrowLeftRight, Clock } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SourceModal from "./SourceModal";
import type { HorarioFlat } from "@/pages/index";

interface BusScheduleFilterProps {
  schedules: HorarioFlat[];
  rotasMapa?: Record<string, string[]>;
}

// ── Helpers ───────────────────────────────────────────────────────────────
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
  if (diff < 60) return `em ${diff} min`;
  const horas = Math.floor(diff / 60);
  const mins = diff % 60;
  return mins > 0 ? `em ${horas}h ${mins}min` : `em ${horas}h`;
};

const INITIAL_DATE = new Date(2000, 0, 1);
const INITIAL_TIME = "00:00";

// ── Componente ────────────────────────────────────────────────────────────
const BusScheduleFilter: React.FC<BusScheduleFilterProps> = ({ schedules, rotasMapa }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(INITIAL_DATE);
  const [selectedTime, setSelectedTime] = useState(INITIAL_TIME);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [agora, setAgora] = useState<Date>(new Date());
  const itensPorPagina = 10;

  // Inicializa com hora atual após hidratação
  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
    setIsHydrated(true);
  }, []);

  // Atualiza "agora" a cada minuto para o countdown
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

  // Destinos filtrados pelo mapa de rotas (se disponível)
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
    let finalDestinos = destinosDisponiveis;

    if (origin) {
      filtered = filtered.filter((s) => s.origem === origin);
      // Usa mapa de rotas se disponível, senão deriva dos dados
      finalDestinos = destinosPorOrigem ?? Array.from(new Set(filtered.map((s) => s.destino))).sort();
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

  // Info da rota selecionada
  const rotaInfo = useMemo(() => {
    if (!origin || !destination) return null;
    const amostra = filteredSchedules[0];
    if (!amostra) return null;
    return {
      linha: amostra.linha,
      tarifaComum: amostra.tarifaComum,
      tarifaEstudante: amostra.tarifaEstudante,
      empresa: amostra.empresaNome,
    };
  }, [filteredSchedules, origin, destination]);

  const handleClear = () => {
    resetParaAgora();
    setOrigin("");
    setDestination("");
  };

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <>
      <Card className="p-4 md:p-6 max-w-5xl mx-auto shadow-lg bg-card text-card-foreground">
        <CardContent className="flex flex-col gap-5 p-0">

          {/* ── Filtros ── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

            {/* Data e Hora */}
            <div className="flex flex-col sm:flex-row gap-3 lg:col-span-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isHydrated ? format(selectedDate, "EEE, dd/MM", { locale: ptBR }) : "—"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    disabled={(date) => isBefore(date, startOfToday())}
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>

              {/* Hora + botão Agora */}
              <div className="flex gap-2 sm:w-[170px]">
                <div className="relative flex-1">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetParaAgora}
                  title="Voltar para agora"
                  className="shrink-0 px-2"
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Origem ⇄ Destino */}
            <div className="flex items-center gap-2 lg:col-span-6">
              <Select value={origin} onValueChange={(v) => { setOrigin(v); setDestination(""); }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Origem" />
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
                title="Inverter origem e destino"
                className="shrink-0 rounded-full border-primary/30 hover:border-primary/60 px-2"
              >
                <ArrowLeftRight className="h-4 w-4 text-primary" />
              </Button>

              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Limpar */}
            <div className="lg:col-span-2">
              <Button variant="destructive" onClick={handleClear} className="w-full">
                <FilterX className="mr-2 w-4 h-4" /> Limpar
              </Button>
            </div>
          </div>

          {/* ── Info da rota selecionada ── */}
          {rotaInfo && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-sm">
              <span className="font-semibold text-foreground">🚌 {rotaInfo.linha ?? `${origin} → ${destination}`}</span>
              <span className="text-muted-foreground">{rotaInfo.empresa}</span>
              <div className="ml-auto flex flex-wrap gap-2">
                {rotaInfo.tarifaComum && (
                  <span className="rounded-full bg-background border px-2.5 py-0.5 text-xs font-medium">
                    Comum: <strong>{formatTarifa(rotaInfo.tarifaComum)}</strong>
                  </span>
                )}
                {rotaInfo.tarifaEstudante && (
                  <span className="rounded-full bg-background border px-2.5 py-0.5 text-xs font-medium">
                    Estudante: <strong>{formatTarifa(rotaInfo.tarifaEstudante)}</strong>
                  </span>
                )}
                <span className="rounded-full bg-background border px-2.5 py-0.5 text-xs text-muted-foreground">
                  {filteredSchedules.length} horário{filteredSchedules.length !== 1 ? "s" : ""} restante{filteredSchedules.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {/* ── Próximo ônibus destaque ── */}
          {proximoHorario && isHoje && (
            <div className="flex items-center gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 px-4 py-3">
              <div className="text-3xl font-bold tabular-nums text-primary">
                {proximoHorario.horario}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  Próximo ônibus — {tempoAte(proximoHorario.horario)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {proximoHorario.origem} → {proximoHorario.destino}
                  {proximoHorario.tipo === "intermediario" && " · passa por ponto intermediário"}
                </p>
              </div>
              {proximoHorario.sourceUrl && (
                <button
                  onClick={() => setModalUrl(proximoHorario.sourceUrl!)}
                  className="shrink-0 p-2 text-muted-foreground hover:text-primary rounded-full transition-colors"
                  title="Ver fonte"
                >
                  <LinkIcon size={14} />
                </button>
              )}
            </div>
          )}

          {/* ── Resultados ── */}
          <div>
            <h3 className="font-bold text-lg mb-3">
              Horários disponíveis
              {!rotaInfo && filteredSchedules.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {filteredSchedules.length} resultado{filteredSchedules.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>

            {paginatedSchedules.length > 0 ? (
              <>
                {/* Tabela — desktop */}
                <div className="hidden md:block overflow-x-auto border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Horário</th>
                        <th className="px-3 py-2 text-left font-semibold">Origem</th>
                        <th className="px-3 py-2 text-left font-semibold">Destino</th>
                        <th className="px-3 py-2 text-left font-semibold">Dia</th>
                        <th className="px-3 py-2 text-left font-semibold">Saída</th>
                        <th className="px-3 py-2 text-left font-semibold">Tarifa</th>
                        <th className="px-3 py-2 text-left font-semibold">Empresa</th>
                        <th className="px-3 py-2 text-right font-semibold">Fonte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedSchedules.map((s, idx) => {
                        const isProximo = idx === 0 && currentPage === 1 && isHoje;
                        return (
                          <tr key={s.id} className={`hover:bg-muted/40 ${isProximo ? "bg-primary/5" : ""}`}>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-primary tabular-nums">{s.horario}</span>
                                {isProximo && isHoje && (
                                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                                    {tempoAte(s.horario)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">{s.origem}</td>
                            <td className="px-3 py-2">{s.destino}</td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{s.diaDaSemana}</td>
                            <td className="px-3 py-2 text-xs">
                              {s.tipo === "intermediario" ? (
                                <span className="rounded-full px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                  ponto
                                </span>
                              ) : (
                                <span className="rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
                                  rodoviária
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">
                              {formatTarifa(s.tarifaComum) ?? "—"}
                            </td>
                            <td className="px-3 py-2 text-xs text-muted-foreground">{s.empresaNome}</td>
                            <td className="px-3 py-2 text-right">
                              {s.sourceUrl && (
                                <button
                                  onClick={() => setModalUrl(s.sourceUrl!)}
                                  className="inline-flex p-2 text-muted-foreground hover:text-primary transition-colors rounded-full"
                                  title="Ver fonte"
                                >
                                  <LinkIcon size={14} />
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
                <div className="flex flex-col gap-3 md:hidden">
                  {paginatedSchedules.map((s, idx) => {
                    const isProximo = idx === 0 && currentPage === 1 && isHoje;
                    return (
                      <div
                        key={s.id}
                        className={`rounded-xl border p-4 ${isProximo ? "border-primary/40 bg-primary/5" : "bg-card"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl font-bold tabular-nums text-primary">{s.horario}</span>
                              {isProximo && isHoje && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                                  {tempoAte(s.horario)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {s.origem} → {s.destino}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.diaDaSemana}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {s.tipo === "intermediario" ? (
                              <span className="rounded-full px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                                ponto
                              </span>
                            ) : (
                              <span className="rounded-full px-2 py-0.5 text-xs bg-muted text-muted-foreground">
                                rodoviária
                              </span>
                            )}
                            {s.tarifaComum && (
                              <span className="text-xs text-muted-foreground">{formatTarifa(s.tarifaComum)}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t">
                          <span className="text-xs text-muted-foreground">{s.empresaNome}</span>
                          {s.sourceUrl && (
                            <button
                              onClick={() => setModalUrl(s.sourceUrl!)}
                              className="p-1.5 text-muted-foreground hover:text-primary rounded-full transition-colors"
                              title="Ver fonte"
                            >
                              <LinkIcon size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
                      Próximo
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {origin || destination
                    ? "Nenhum horário disponível para esta rota nos filtros selecionados."
                    : "Selecione origem e destino para ver os horários."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {modalUrl && <SourceModal url={modalUrl} onClose={() => setModalUrl(null)} />}
    </>
  );
};

export default BusScheduleFilter;
