"use client";

import React, { useEffect, useState } from "react";
import { format, isBefore } from "date-fns";
import { CalendarIcon, ClockIcon, FilterX } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

import type { Horario } from "@/types/schedule";

interface BusScheduleFilterProps {
  schedules: Horario[];
}

const BusScheduleFilter: React.FC<BusScheduleFilterProps> = ({ schedules }) => {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [selectedTime, setSelectedTime] = useState(format(now, "HH:mm"));
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [filteredSchedules, setFilteredSchedules] = useState<Horario[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const itensPorPagina = 5;
  const totalPages = Math.ceil(filteredSchedules.length / itensPorPagina);

  const getCategoriaDia = (date: Date): string => {
    const dia = date.getDay();
    if (dia === 0) return "Domingo e Feriados";
    if (dia === 6) return "Sábado";
    return "Segunda à Sexta";
  };

  const isHoje = format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd");

  const filterSchedules = () => {
    const categoriaDiaAtual = getCategoriaDia(selectedDate);
    let resultados = schedules.filter((schedule) => schedule.diaDaSemana === categoriaDiaAtual);

    if (origin) {
      resultados = resultados.filter((s) =>
        s.origem.toLowerCase().includes(origin.toLowerCase())
      );
    }

    if (destination) {
      resultados = resultados.filter((s) =>
        s.destino.toLowerCase().includes(destination.toLowerCase())
      );
    }

    resultados = resultados.filter((s) => s.horario >= selectedTime);
    resultados.sort((a, b) => a.horario.localeCompare(b.horario));

    setFilteredSchedules(resultados);
    setCurrentPage(1); // Reseta a página ao aplicar filtro
  };

  useEffect(() => {
    filterSchedules();
  }, [selectedDate, selectedTime, origin, destination, schedules]);

  const handleClear = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
    setOrigin("");
    setDestination("");
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, now.setHours(0, 0, 0, 0));
  };

  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itensPorPagina,
    currentPage * itensPorPagina
  );

  return (
    <Card className="p-6 max-w-5xl mx-auto shadow-md bg-white">
      <CardContent className="flex flex-col gap-6">
        {/* Filtros */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-gray-600" />
            <Popover>
              <PopoverTrigger asChild>
                <Button className="w-[160px] justify-start text-left font-normal">
                  {format(selectedDate, "dd/MM/yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  disabled={isDateDisabled}
                />
              </PopoverContent>
            </Popover>

            <ClockIcon className="text-gray-600" />
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              min={isHoje ? format(now, "HH:mm") : undefined}
              className="w-[100px]"
              onFocus={(e) => e.target.showPicker?.()}
            />
          </div>

          <div className="flex gap-3">
            <Input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Origem"
            />
            <Input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Destino"
            />
            <Button
              variant="destructive"
              onClick={handleClear}
              className="whitespace-nowrap"
            >
              <FilterX className="mr-2 w-4 h-4" />
              Limpar
            </Button>
          </div>
        </div>

        {/* Resultados */}
        <div>
          <h3 className="font-bold text-lg mb-3">Horários encontrados:</h3>
          {paginatedSchedules.length > 0 ? (
            <>
              <ul className="divide-y border rounded-md">
                {paginatedSchedules.map((schedule) => (
                  <li key={schedule.id} className="p-3 text-sm">
                    <div className="font-semibold text-gray-800">
                      {schedule.horario} - {schedule.origem} ➝ {schedule.destino}
                    </div>
                    {schedule.observacao && (
                      <div className="text-xs text-gray-500">{schedule.observacao}</div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Paginação */}
              <div className="flex justify-center items-center gap-2 mt-4 flex-wrap">
                <Button
                  variant="ghost"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  Anterior
                </Button>

                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index}
                    variant={currentPage === index + 1 ? "default" : "ghost"}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </Button>
                ))}

                <Button
                  variant="ghost"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Próximo
                </Button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">Nenhum horário disponível.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusScheduleFilter;
