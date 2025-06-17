// components/BusScheduleFilter.tsx
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { format, isBefore, startOfToday } from "date-fns";
import { CalendarIcon, ClockIcon, FilterX } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type { Horario } from "@/types/schedule";

interface BusScheduleFilterProps {
  schedules: Horario[];
}

// ANÁLISE: Função auxiliar para obter o dia da semana. Está correta.
const getCategoriaDia = (date: Date): string => {
  const dia = date.getDay();
  if (dia === 0) return "Domingo e Feriados";
  if (dia === 6) return "Sábado";
  return "Segunda à Sexta";
};

const BusScheduleFilter: React.FC<BusScheduleFilterProps> = ({ schedules }) => {
  // REATORAÇÃO: `now` agora é obtido a cada render, garantindo que esteja sempre atualizado.
  // Usamos `useState` com uma função para garantir que a `new Date()` seja chamada apenas na inicialização.
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [selectedTime, setSelectedTime] = useState(() => format(new Date(), "HH:mm"));
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itensPorPagina = 5;

  // REATORAÇÃO: Lógica de filtros interdependentes e estado derivado com `useMemo`.
  // Isso é mais performático e declarativo que o `useEffect` anterior.
  const {
    filteredSchedules,
    availableOrigins,
    availableDestinations
  } = useMemo(() => {
    const now = new Date();
    const categoriaDiaAtual = getCategoriaDia(selectedDate);
    const isHoje = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

    // 1. Filtra por dia da semana e, se for hoje, por horário
    let schedulesDoDia = schedules.filter((schedule) => {
      const isDiaCorreto = schedule.diaDaSemana === categoriaDiaAtual;
      // Se for hoje, só mostra horários futuros a partir do horário selecionado
      if (isHoje) {
        return isDiaCorreto && schedule.horario >= selectedTime;
      }
      return isDiaCorreto;
    });

    // 2. Cria as listas de filtros disponíveis a partir dos horários do dia
    const potentialOrigins = Array.from(new Set(schedulesDoDia.map((s) => s.origem))).sort();
    const potentialDestinations = Array.from(new Set(schedulesDoDia.map((s) => s.destino))).sort();

    // 3. Aplica os filtros de origem e destino selecionados pelo usuário
    let finalFiltered = [...schedulesDoDia];
    let finalAvailableOrigins = potentialOrigins;
    let finalAvailableDestinations = potentialDestinations;

    if (origin) {
      finalFiltered = finalFiltered.filter((s) => s.origem === origin);
      // UX: A lista de destinos agora só mostra destinos possíveis a partir da origem selecionada
      finalAvailableDestinations = Array.from(new Set(finalFiltered.map(s => s.destino))).sort();
    }
    
    if (destination) {
      finalFiltered = finalFiltered.filter((s) => s.destino === destination);
      // UX: A lista de origens agora só mostra origens que vão para o destino selecionado
      if (!origin) { // Só atualiza as origens se uma não estiver já selecionada
        finalAvailableOrigins = Array.from(new Set(finalFiltered.map(s => s.origem))).sort();
      }
    }
    
    // Ordena os resultados finais por horário
    finalFiltered.sort((a, b) => a.horario.localeCompare(b.horario));

    return {
      filteredSchedules: finalFiltered,
      availableOrigins: finalAvailableOrigins,
      availableDestinations: finalAvailableDestinations
    };
  }, [schedules, selectedDate, selectedTime, origin, destination]);


  // REATORAÇÃO: O useEffect de filtro foi removido. A lógica de paginação agora usa `filteredSchedules` diretamente.
  const totalPages = Math.ceil(filteredSchedules.length / itensPorPagina);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itensPorPagina,
    currentPage * itensPorPagina
  );

  // Efeito para resetar a página quando os filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSchedules]); // Usar filteredSchedules aqui é seguro

  const handleClear = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
    setOrigin("");
    setDestination("");
    setCurrentPage(1);
  };
  
  // ANÁLISE: Lógica de desabilitar datas passadas está correta.
  const isDateDisabled = (date: Date) => isBefore(date, startOfToday());

  return (
    // O JSX permanece em grande parte o mesmo, mas agora consome as listas de filtros dinâmicas.
    <Card className="p-4 md:p-6 max-w-5xl mx-auto shadow-lg bg-card text-card-foreground">
      <CardContent className="flex flex-col gap-6 p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* Data e Hora */}
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
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full pl-9"
              />
            </div>
          </div>
          
          {/* Origem e Destino */}
          <div className="flex flex-col sm:flex-row gap-4 lg:col-span-5">
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                {availableOrigins.map((cidade) => (
                  <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Destino" />
              </SelectTrigger>
              <SelectContent>
                {availableDestinations.map((cidade) => (
                  <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
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
        
        {/* Resultados e Paginação (mesma lógica de antes, só visualmente ajustada) */}
        <div>
          <h3 className="font-bold text-lg mb-3">Horários encontrados:</h3>
          {paginatedSchedules.length > 0 ? (
            <>
              {/* Lista */}
              <ul className="divide-y border rounded-md">
                {paginatedSchedules.map((schedule) => (
                  <li key={schedule.id} className="p-3">
                    <div className="font-semibold text-base">
                      <span className="text-primary">{schedule.horario}</span> - {schedule.origem} ➝ {schedule.destino}
                    </div>
                    {schedule.observacao && (
                      <div className="text-xs text-muted-foreground mt-1">{schedule.observacao}</div>
                    )}
                  </li>
                ))}
              </ul>
              {/* Paginação */}
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
  );
};

export default BusScheduleFilter;