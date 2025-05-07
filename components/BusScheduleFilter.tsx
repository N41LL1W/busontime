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
  // const [diasDaSemana, setDiasDaSemana] = useState<string[]>([]); // Não parece estar sendo usado diretamente nos filtros visuais
  
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
    
    // Filtrar horários a partir do selectedTime
    // Atenção: Comparar strings de horário pode não ser ideal se os formatos variarem.
    // Considere converter para minutos do dia ou objetos Date para comparação mais robusta se necessário.
    resultados = resultados.filter((s) => s.horario >= selectedTime);
    resultados.sort((a, b) => a.horario.localeCompare(b.horario));
    
    setFilteredSchedules(resultados);
    setCurrentPage(1);
  };
  
  useEffect(() => {
    const origensUnicas = Array.from(new Set(schedules.map((s) => s.origem))).sort();
    const destinosUnicos = Array.from(new Set(schedules.map((s) => s.destino))).sort();
    // const diasUnicos = Array.from(new Set(schedules.map((s) => s.diaDaSemana))); // Se não for usado, pode remover
    setOrigens(origensUnicas);
    setDestinos(destinosUnicos);
    // setDiasDaSemana(diasUnicos);
  }, [schedules]);
  
  useEffect(() => {
    filterSchedules();
    // A dependência 'schedules' aqui pode causar re-renderizações frequentes se filterSchedules modificar algo que 'schedules' depende indiretamente
    // Se 'schedules' for uma prop estável que só muda quando os dados da API são buscados, está ok.
  }, [selectedDate, selectedTime, origin, destination, schedules]); // Removido filterSchedules da lista de dependências para evitar loop se ele próprio modificar uma dependência
  
  const handleClear = () => {
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(format(now, "HH:mm"));
    setOrigin("");
    setDestination("");
  };
  
  const isDateDisabled = (date: Date) => {
    // Garante que a comparação seja feita apenas com a data, ignorando a hora.
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return isBefore(date, todayStart);
  };
  
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itensPorPagina,
    currentPage * itensPorPagina
  );
  
  return (
    <Card className="p-4 md:p-6 max-w-5xl mx-auto shadow-md bg-white dark:bg-gray-800 dark:text-gray-100">
      <CardContent className="flex flex-col gap-6">
        {/* Filtros */}
        {/* Container principal dos filtros, grid em desktop, flex-col em mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Coluna/Seção de Data e Hora */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <CalendarIcon className="flex-shrink-0" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full sm:w-[160px] justify-start text-left font-normal border dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600"
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
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ClockIcon className="flex-shrink-0" />
              <Input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                min={isHoje ? format(now, "HH:mm") : undefined}
                className="w-full sm:w-[110px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                onFocus={(e) => e.target.showPicker?.()}
              />
            </div>
          </div>
          
          {/* Coluna/Seção de Origem, Destino e Limpar */}
          {/* Em mobile (default), será flex-col. Em sm+, será flex-row e wrap. */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <div className="w-full sm:flex-1 sm:min-w-[140px]"> {/* Permite que o select cresça mas tenha um min-width */}
              <Select value={origin} onValueChange={setOrigin}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
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
            </div>

            <div className="w-full sm:flex-1 sm:min-w-[140px]">
              <Select value={destination} onValueChange={setDestination}>
                <SelectTrigger className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
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
            </div>
            
            <div className="w-full sm:w-auto"> {/* Botão de limpar ocupa largura total em mobile, auto em sm+ */}
              <Button
                variant="destructive"
                onClick={handleClear}
                className="w-full whitespace-nowrap bg-red-500 dark:bg-red-700 text-white dark:text-gray-100 hover:bg-red-600 dark:hover:bg-red-800"
              >
                <FilterX className="mr-2 w-4 h-4" />
                Limpar
              </Button>
            </div>
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
              <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm" // Botões menores para paginação podem ajudar em mobile
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Anterior
                </Button>
                
                {[...Array(totalPages)].map((_, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={currentPage === index + 1 ? "default" : "ghost"}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`px-2 sm:px-3 ${ // Menor padding horizontal em mobile
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
                  size="sm"
                  disabled={currentPage === totalPages || totalPages === 0} // Adicionado totalPages === 0
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Próximo
                </Button>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic dark:text-gray-400">Nenhum horário disponível para os filtros selecionados.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BusScheduleFilter;