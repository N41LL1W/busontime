"use client";

import React, { useEffect, useState } from "react";
import { format, isBefore } from "date-fns";
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

const BusScheduleFilter: React.FC<BusScheduleFilterProps> = ({ schedules }) => {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [selectedTime, setSelectedTime] = useState(format(now, "HH:mm"));
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [filteredSchedules, setFilteredSchedules] = useState<Horario[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [origens, setOrigens] = useState<string[]>([]);
  const [destinos, setDestinos] = useState<string[]>([]);
  const [diasDaSemana, setDiasDaSemana] = useState<string[]>([]);
  
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
      resultados = resultados.filter((s) => s.origem === origin);
    }
    
    if (destination) {
      resultados = resultados.filter((s) => s.destino === destination);
    }
    
    resultados = resultados.filter((s) => s.horario >= selectedTime);
    resultados.sort((a, b) => a.horario.localeCompare(b.horario));
    
    setFilteredSchedules(resultados);
    setCurrentPage(1);
  };
  
  useEffect(() => {
    const origensUnicas = Array.from(new Set(schedules.map((s) => s.origem))).sort();
    const destinosUnicos = Array.from(new Set(schedules.map((s) => s.destino))).sort();
    const diasUnicos = Array.from(new Set(schedules.map((s) => s.diaDaSemana)));
    setOrigens(origensUnicas);
    setDestinos(destinosUnicos);
    setDiasDaSemana(diasUnicos);
  }, [schedules]);
  
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
    <Card className="p-6 max-w-5xl mx-auto shadow-md bg-white dark:bg-gray-800 dark:text-gray-100">
    <CardContent className="flex flex-col gap-6">
    {/* Filtros */}
    <div className="grid md:grid-cols-2 gap-4">
    <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
    <CalendarIcon />
    <Popover>
    <PopoverTrigger asChild>
  <Button
    variant="ghost" // Especifica a variante ghost
    className="w-[160px] justify-start text-left font-normal border dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
  >
    {format(selectedDate, "dd/MM/yyyy")}
  </Button>
</PopoverTrigger>
    <PopoverContent className="w-auto p-0 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700">
    <Calendar
    mode="single"
    selected={selectedDate}
    onSelect={(date) => date && setSelectedDate(date)}
    disabled={isDateDisabled}
    />
    </PopoverContent>
    </Popover>
    
    <ClockIcon />
    <Input
    type="time"
    value={selectedTime}
    onChange={(e) => setSelectedTime(e.target.value)}
    min={isHoje ? format(now, "HH:mm") : undefined}
    className="w-[100px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
    onFocus={(e) => e.target.showPicker?.()}
    />
    </div>
    
    <div className="flex gap-3 flex-wrap">
    <Select value={origin} onValueChange={setOrigin}>
    <SelectTrigger className="w-[140px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
    <SelectValue placeholder="Origem" />
    </SelectTrigger>
    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700">
    {origens.map((cidade) => (
      <SelectItem key={cidade} value={cidade}>
      {cidade}
      </SelectItem>
    ))}
    </SelectContent>
    </Select>
    
    <Select value={destination} onValueChange={setDestination}>
    <SelectTrigger className="w-[140px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
    <SelectValue placeholder="Destino" />
    </SelectTrigger>
    <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border dark:border-gray-700">
    {destinos.map((cidade) => (
      <SelectItem key={cidade} value={cidade}>
      {cidade}
      </SelectItem>
    ))}
    </SelectContent>
    </Select>
    
    <Button
    variant="destructive"
    onClick={handleClear}
    className="whitespace-nowrap bg-red-500 dark:bg-red-700 text-white dark:text-gray-100 hover:bg-red-600 dark:hover:bg-red-800"
    >
    <FilterX className="mr-2 w-4 h-4" />
    Limpar
    </Button>
    </div>
    </div>
    
    {/* Resultados */}
    <div>
    <h3 className="font-bold text-lg mb-3 text-gray-800 dark:text-gray-200">Horários encontrados:</h3>
    {paginatedSchedules.length > 0 ? (
      <>
      <ul className="divide-y border rounded-md border-gray-200 dark:border-gray-700">
      {paginatedSchedules.map((schedule) => (
        <li key={schedule.id} className="p-3 text-sm text-gray-800 dark:text-gray-100">
        <div className="font-semibold">
        {schedule.horario} - {schedule.origem} ➝ {schedule.destino}
        </div>
        {schedule.observacao && (
          <div className="text-xs text-gray-500 dark:text-gray-400">{schedule.observacao}</div>
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
      className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
      Anterior
      </Button>
      
      {[...Array(totalPages)].map((_, index) => (
        <Button
        key={index}
        variant={currentPage === index + 1 ? "default" : "ghost"}
        onClick={() => setCurrentPage(index + 1)}
        className={`${
          currentPage === index + 1
          ? "bg-blue-500 text-white dark:bg-blue-700 dark:text-gray-100"
          : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        }`}
        >
        {index + 1}
        </Button>
      ))}
      
      <Button
      variant="ghost"
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((p) => p + 1)}
      className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
      Próximo
      </Button>
      </div>
      </>
    ) : (
      <p className="text-gray-500 italic dark:text-gray-400">Nenhum horário disponível.</p>
    )}
    </div>
    </CardContent>
    </Card>
  );
};

export default BusScheduleFilter;