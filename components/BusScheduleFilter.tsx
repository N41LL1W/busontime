"use client";

import React, { useMemo, useState, useEffect } from "react";
import { format, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, ClockIcon, FilterX, LinkIcon, ArrowLeftRight } from "lucide-react";

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
}

const getDiaDaSemana = (date: Date): string => {
  const dia = date.getDay();
  if (dia === 0) return "Domingo e Feriados";
  if (dia === 6) return "Sábado";
  return "Segunda a Sexta";
};

const formatTarifa = (valor: number | null) =>
  valor != null ? `R$ ${valor.toFixed(2).replace(".", ",")}` : "—";

const INITIAL_DATE = new Date(2000, 0, 1);
const INITIAL_TIME = "00:00";

const BusScheduleFilter: React.FC<BusScheduleFilterProps> = ({ schedules }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(INITIAL_DATE);
  const [selectedTime, setSelectedTime] = useState(INITIAL_TIME);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const itensPorPagina = 10;

  useEffect(() => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
  }, []);

  const { filteredSchedules, availableOrigins, availableDestinations } = useMemo(() => {
    const now = new Date();
    const diaDaSemana = getDiaDaSemana(selectedDate);
    const isHoje = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

    // Só mostra horários de IDA — volta aparece ao inverter origem/destino
    let base = schedules.filter((s) => {
      if (s.sentido !== "ida") return false;
      const diaOk = s.diaDaSemana === diaDaSemana;
      if (isHoje) return diaOk && s.horario >= selectedTime;
      return diaOk;
    });

    const origensDisponiveis = Array.from(new Set(base.map((s) => s.origem))).sort();
    const destinosDisponiveis = Array.from(new Set(base.map((s) => s.destino))).sort();

    let filtered = [...base];
    let finalOrigens = origensDisponiveis;
    let finalDestinos = destinosDisponiveis;

    if (origin) {
      filtered = filtered.filter((s) => s.origem === origin);
      finalDestinos = Array.from(new Set(filtered.map((s) => s.destino))).sort();
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
  }, [schedules, selectedDate, selectedTime, origin, destination]);

  useEffect(() => {
    if (destination && !availableDestinations.includes(destination)) setDestination("");
  }, [availableDestinations, destination]);

  useEffect(() => { setCurrentPage(1); }, [filteredSchedules]);

  const totalPages = Math.ceil(filteredSchedules.length / itensPorPagina);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itensPorPagina,
    currentPage * itensPorPagina
  );

  const handleClear = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
    setOrigin("");
    setDestination("");
  };

  // Inverte origem e destino
  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <>
      <Card className="p-4 md:p-6 max-w-5xl mx-auto shadow-lg bg-card text-card-foreground">
        <CardContent className="flex flex-col gap-6 p-0">

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Data e Hora */}
            <div className="flex flex-col sm:flex-row gap-4 lg:col-span-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd/MM/yyyy")}
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
              <div className="relative w-full sm:w-[130px]">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
            </div>

            {/* Origem, Swap e Destino */}
            <div className="flex items-center gap-2 lg:col-span-6">
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  {availableOrigins.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Botão swap */}
              <Button
                variant="outline"
                onClick={handleSwap}
                disabled={!origin && !destination}
                title="Inverter origem e destino"
                className="shrink-0 rounded-full border-primary/30 hover:border-primary/60 transition-colors p-2"
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

          {/* Resultados */}
          <div>
            <h3 className="font-bold text-lg mb-3">
              Horários encontrados:
              {filteredSchedules.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {filteredSchedules.length} resultado{filteredSchedules.length !== 1 ? "s" : ""}
                </span>
              )}
            </h3>

            {paginatedSchedules.length > 0 ? (
              <>
                <div className="overflow-x-auto border rounded-md">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Origem</th>
                        <th className="px-3 py-2 text-left font-semibold">Destino</th>
                        <th className="px-3 py-2 text-left font-semibold">Dia</th>
                        <th className="px-3 py-2 text-left font-semibold">Horário</th>
                        <th className="px-3 py-2 text-left font-semibold">Saída</th>
                        <th className="px-3 py-2 text-left font-semibold">Tarifa</th>
                        <th className="px-3 py-2 text-left font-semibold">Empresa</th>
                        <th className="px-3 py-2 text-right font-semibold">Fonte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedSchedules.map((s) => (
                        <tr key={s.id} className="hover:bg-muted/40">
                          <td className="px-3 py-2">{s.origem}</td>
                          <td className="px-3 py-2">{s.destino}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{s.diaDaSemana}</td>
                          <td className="px-3 py-2 font-semibold text-primary">{s.horario}</td>
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
                            {formatTarifa(s.tarifaComum)}
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{s.empresaNome}</td>
                          <td className="px-3 py-2 text-right">
                            {s.sourceUrl && (
                              <button
                                onClick={() => setModalUrl(s.sourceUrl!)}
                                className="inline-flex p-2 text-muted-foreground hover:text-primary transition-colors rounded-full"
                                title="Ver fonte"
                                aria-label="Ver fonte do horário"
                              >
                                <LinkIcon size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

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
              <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Nenhum horário disponível para os filtros selecionados.</p>
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
