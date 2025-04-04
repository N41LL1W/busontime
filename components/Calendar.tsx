import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());

  const startOfMonth = currentDate.startOf("month");
  const endOfMonth = currentDate.endOf("month");
  const startWeekday = startOfMonth.day();
  const daysInMonth = endOfMonth.date();

  const prevMonth = () => setCurrentDate(currentDate.subtract(1, "month"));
  const nextMonth = () => setCurrentDate(currentDate.add(1, "month"));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center py-8 px-4">
      <div className="max-w-sm w-full shadow-lg bg-white dark:bg-gray-800 rounded-lg p-5">
        <div className="flex items-center justify-between">
          <span className="text-base font-bold dark:text-gray-100 text-gray-800">
            {currentDate.format("MMMM YYYY")}
          </span>
          <div className="flex items-center">
            <button onClick={prevMonth} className="text-gray-800 dark:text-gray-100 hover:text-gray-400">
              <ChevronLeft size={24} />
            </button>
            <button onClick={nextMonth} className="ml-3 text-gray-800 dark:text-gray-100 hover:text-gray-400">
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
        <div className="pt-4">
          <table className="w-full">
            <thead>
              <tr className="text-gray-800 dark:text-gray-100">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
                  <th key={day} className="text-center text-sm font-medium p-1">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(Math.ceil((daysInMonth + startWeekday) / 7))].map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {[...Array(7)].map((_, colIndex) => {
                    const dayNumber = rowIndex * 7 + colIndex - startWeekday + 1;
                    return (
                      <td key={colIndex} className="p-2 text-center text-gray-500 dark:text-gray-100">
                        {dayNumber > 0 && dayNumber <= daysInMonth ? dayNumber : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
