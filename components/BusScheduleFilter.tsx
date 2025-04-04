"use client";

import { useEffect, useState } from "react";
import { Schedule } from "@/types";
import { format, isAfter } from "date-fns";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Calendar } from "./ui/calendar";
import { ptBR } from "date-fns/locale";

interface BusScheduleFilterProps {
  schedules: Schedule[];
}

export function BusScheduleFilter({ schedules }: BusScheduleFilterProps) {
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(now);
  const [selectedTime, setSelectedTime] = useState<string>(format(now, "HH:mm"));
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [origin, setOrigin] = useState<string>("");
  const [destination, setDestination] = useState<string>("");

  // Função para mapear a data para o valor customizado do banco
  const getCategoriaDia = (date: Date) => {
    const dia = date.getDay();
    if (dia === 0) return "Domingo e Feriados";
    if (dia === 6) return "Sábado";
    return "Segunda à Sexta";
  };

  const filterSchedules = () => {
    const categoriaDiaAtual = getCategoriaDia(selectedDate);
    const hoje = format(now, "yyyy-MM-dd");
    const dataSelecionada = format(selectedDate, "yyyy-MM-dd");
    const isHoje = dataSelecionada === hoje;

    let resultados = schedules.filter(
      (schedule) => schedule.diaDaSemana === categoriaDiaAtual
    );

    // Filtro por origem e destino
    if (origin) {
      resultados = resultados.filter((s) =>
        s.itinerario.toLowerCase().includes(origin.toLowerCase())
      );
    }

    if (destination) {
      resultados = resultados.filter((s) =>
        s.itinerario.toLowerCase().includes(destination.toLowerCase())
      );
    }

    // Filtro por horário selecionado (considerando somente horários após o escolhido)
    if (selectedTime) {
      resultados = resultados.filter((s) => {
        const [hora, minuto] = selectedTime.split(":").map(Number);
        const horarioSelecionado = new Date(selectedDate);
        horarioSelecionado.setHours(hora, minuto, 0, 0);

        const [horaHorario, minutoHorario] = s.horario.split(":").map(Number);
        const horarioBanco = new Date(selectedDate);
        horarioBanco.setHours(horaHorario, minutoHorario, 0, 0);

        return isAfter(horarioBanco, horarioSelecionado);
      });
    }

    setFilteredSchedules(resultados);
  };

  useEffect(() => {
    filterSchedules();
  }, [selectedDate, selectedTime, origin, destination, schedules]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardContent className="pt-4 flex flex-col gap-2">
          <h2 className="font-semibold text-lg">Escolha a data:</h2>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            locale={ptBR}
            fromDate={now} // bloqueia datas passadas
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 flex flex-col gap-2">
          <h2 className="font-semibold text-lg">Escolha o horário:</h2>
          <Input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            min={
              format(selectedDate, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")
                ? format(now, "HH:mm")
                : "00:00"
            }
            className="w-[100px]"
            onFocus={(e) => e.target.showPicker?.()} // Força abrir o seletor
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 flex flex-col gap-2">
          <h2 className="font-semibold text-lg">Filtro por itinerário:</h2>
          <Input
            placeholder="Origem"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
          />
          <Input
            placeholder="Destino"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <Button variant="default" onClick={filterSchedules}>
            Filtrar
          </Button>
        </CardContent>
      </Card>

      <div className="md:col-span-2 lg:col-span-3 mt-4">
        <h3 className="font-semibold text-lg mb-2">
          Resultados encontrados: {filteredSchedules.length}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {filteredSchedules.map((s, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p><strong>Horário:</strong> {s.horario}</p>
                <p><strong>Itinerário:</strong> {s.itinerario}</p>
                <p><strong>Dia da Semana:</strong> {s.diaDaSemana}</p>
                {s.tarifa && <p><strong>Tarifa:</strong> R$ {s.tarifa}</p>}
                {s.observacao && <p><strong>Obs.:</strong> {s.observacao}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BusScheduleFilter;