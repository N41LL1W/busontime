"use client";

// Importações do React e bibliotecas
import React, { useMemo, useState, useEffect } from "react";
import { format, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, ClockIcon, FilterX, LinkIcon } from "lucide-react";

// Importações dos seus componentes UI (shadcn/ui)
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Importa o componente de Modal
import SourceModal from "./SourceModal";

// Importa o tipo customizado
import type { HorarioComFonte } from '@/pages/index';

// Props do componente
interface BusScheduleFilterProps {
  schedules: HorarioComFonte[];
}

// Função auxiliar
const getCategoriaDia = (date: Date): string => {
  const dia = date.getDay();
  if (dia === 0) return "Domingo e Feriados";
  if (dia === 6) return "Sábado";
  return "Segunda à Sexta";
};

// Componente principal
const BusScheduleFilter: React.FC<BusScheduleFilterProps> = ({ schedules }) => {
  // ... (Estados e lógica de useMemo, etc. - sem mudanças)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState(() => format(new Date(), "HH:mm"));
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalUrl, setModalUrl] = useState<string | null>(null);
  const itensPorPagina = 10;
  const { filteredSchedules, availableOrigins, availableDestinations } = useMemo(() => {
    const now = new Date();
    const categoriaDiaAtual = getCategoriaDia(selectedDate);
    const isHoje = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");
    let schedulesDoDia = schedules.filter((schedule) => {
      const isDiaCorreto = schedule.diaDaSemana === categoriaDiaAtual;
      if (isHoje) { return isDiaCorreto && schedule.horario >= selectedTime; }
      return isDiaCorreto;
    });
    const potentialOrigins = Array.from(new Set(schedulesDoDia.map((s) => s.origem))).sort();
    const potentialDestinations = Array.from(new Set(schedulesDoDia.map((s) => s.destino))).sort();
    let finalFiltered = [...schedulesDoDia];
    let finalAvailableOrigins = potentialOrigins;
    let finalAvailableDestinations = potentialDestinations;
    if (origin) {
      finalFiltered = finalFiltered.filter((s) => s.origem === origin);
      finalAvailableDestinations = Array.from(new Set(finalFiltered.map(s => s.destino))).sort();
    }
    if (destination) {
      finalFiltered = finalFiltered.filter((s) => s.destino === destination);
      if (!origin) { finalAvailableOrigins = Array.from(new Set(finalFiltered.map(s => s.origem))).sort(); }
    }
    finalFiltered.sort((a, b) => a.horario.localeCompare(b.horario));
    return { filteredSchedules: finalFiltered, availableOrigins: finalAvailableOrigins, availableDestinations: finalAvailableDestinations };
  }, [schedules, selectedDate, selectedTime, origin, destination]);
  const totalPages = Math.ceil(filteredSchedules.length / itensPorPagina);
  const paginatedSchedules = filteredSchedules.slice((currentPage - 1) * itensPorPagina, currentPage * itensPorPagina);
  useEffect(() => { setCurrentPage(1); }, [filteredSchedules]);
  const handleClear = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
    setOrigin("");
    setDestination("");
    setCurrentPage(1);
  };
  const isDateDisabled = (date: Date) => isBefore(date, startOfToday());

  return (
    <>
      <Card className="p-4 md:p-6 max-w-5xl mx-auto shadow-lg bg-card text-card-foreground">
        <CardContent className="flex flex-col gap-6 p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
            {/* Filtros de Data e Hora */}
            <div className="flex flex-col sm:flex-row gap-4 lg:col-span-5">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} disabled={isDateDisabled} />
                </PopoverContent>
              </Popover>
              <div className="relative w-full sm:w-[130px]">
                <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full pl-9" />
              </div>
            </div>
            
            {/* Filtros de Origem e Destino (CORRIGIDOS) */}
            <div className="flex flex-col sm:flex-row gap-4 lg:col-span-5">
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  {availableOrigins.map((cidade) => (<SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Destino" />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations.map((cidade) => (<SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {/* Botão de Limpar */}
            <div className="lg:col-span-2">
              <Button variant="destructive" onClick={handleClear} className="w-full">
                <FilterX className="mr-2 w-4 h-4" /> Limpar
              </Button>
            </div>
          </div>
          
          {/* Seção de Resultados */}
          <div>
            <h3 className="font-bold text-lg mb-3">Horários encontrados:</h3>
            {paginatedSchedules.length > 0 ? (
              <>
                <ul className="divide-y border rounded-md">
                  {paginatedSchedules.map((schedule) => (
                    <li key={schedule.id} className="p-3">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="font-semibold text-base">
                            <span className="text-primary">{schedule.horario}</span> - {schedule.origem} ➝ {schedule.destino}
                          </div>
                          {schedule.observacao && (
                            <div className="text-xs text-muted-foreground mt-1">{schedule.observacao}</div>
                          )}
                        </div>
                        {schedule.sourceUrl && (
                          <button
                            onClick={() => setModalUrl(schedule.sourceUrl)}
                            className="p-2 -mr-2 text-muted-foreground hover:text-primary transition-colors rounded-full"
                            title="Ver fonte do horário"
                            aria-label="Ver fonte do horário"
                          >
                            <LinkIcon size={16} />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <Button variant="ghost" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Anterior</Button>
                    <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                    <Button variant="ghost" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Próximo</Button>
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

      {/* Renderização condicional do Modal */}
      {modalUrl && (
        <SourceModal url={modalUrl} onClose={() => setModalUrl(null)} />
      )}
    </>
  );
};

export default BusScheduleFilter;