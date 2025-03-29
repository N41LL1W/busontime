"use client";

import React, { useState } from "react";

interface WeatherData {
    city: string;
    country: string;
    continent: string;
    date: string;
    temperature: number;
    feelsLike: number;
    tempMin: number;
    tempMax: number;
    humidity: number;
    pressure: number;
    windSpeed: number;
    windDirection: number;
    visibility: number;
    cloudiness: number;
    sunrise: string;
    sunset: string;
    description: string;
    weatherIcon: string;
    timezone: number;
}

const WeatherComponent = () => {
    const [showDetails, setShowDetails] = useState<boolean>(false);
    const [city, setCity] = useState<string>("");
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const fetchWeatherData = async () => {
        try {
            const apiKey = "1319a1fe5a6650905c4684c52b1ac9f6";
            const response = await fetch(
                `http://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`
            );
            
            if (!response.ok) {
                throw new Error("Cidade não encontrada");
            }
            
            const data = await response.json();
            
            // Obtém a hora UTC (fuso horário 0)
            const utcTime = Math.floor(Date.now() / 1000) + new Date().getTimezoneOffset() * 60;
            
            // Converte para a hora local da cidade pesquisada
            const localDate = new Date((utcTime + data.timezone) * 1000).toLocaleString("pt-BR");

            // Converto o sunset e sunrize, para o horario local pesquisado
            const convertToLocalTime = (timestamp: number, timezoneOffset: number) => {
                const date = new Date(timestamp * 1000); // Converte timestamp para milissegundos
                return new Intl.DateTimeFormat("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "UTC"
                }).format(new Date(date.getTime() + timezoneOffset * 1000));
            };
            
            
            setWeatherData({
                city: data.name,
                country: data.sys.country,
                continent: "Desconhecido",
                date: localDate,
                temperature: data.main.temp,
                feelsLike: data.main.feels_like,
                tempMin: data.main.temp_min,
                tempMax: data.main.temp_max,
                humidity: data.main.humidity,
                pressure: data.main.pressure,
                windSpeed: data.wind.speed,
                windDirection: data.wind.deg,
                visibility: data.visibility,
                cloudiness: data.clouds.all,
                sunrise: convertToLocalTime(data.sys.sunrise, data.timezone),
                sunset: convertToLocalTime(data.sys.sunset, data.timezone),
                description: data.weather[0].description,
                weatherIcon: `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
                timezone: data.timezone,
            });
            
            setError(null);
        } catch (error: any) {
            setError(error.message || "Erro ao buscar informações do clima.");
            setWeatherData(null);
        }
    };
    
    const getBackgroundColor = () => {
        if (!weatherData) return "bg-gray-700 text-white";
        
        const utcTime = Math.floor(Date.now() / 1000) + new Date().getTimezoneOffset() * 60;
        const localDate = new Date((utcTime + weatherData.timezone) * 1000);
        const hour = localDate.getHours();
        
        let timeOfDay = "day";
        if (hour >= 18 || hour < 6) timeOfDay = "night";
        else if (hour >= 12) timeOfDay = "afternoon";
        
        const conditions = weatherData.description.toLowerCase();
        
        if (conditions.includes("céu limpo"))
            return timeOfDay === "night" ? "bg-sky-900 text-white" : "bg-yellow-400 text-black";
        
        if (conditions.includes("nuvens"))
            return timeOfDay === "night" ? "bg-gray-800 text-white" : "bg-gray-300 text-black";
        
        if (conditions.includes("nublado"))
            return timeOfDay === "night" ? "bg-gray-900 text-white" : "bg-gray-500 text-white";
        
        if (conditions.includes("chuva") || conditions.includes("leve"))
            return timeOfDay === "night" ? "bg-blue-800 text-white" : "bg-blue-200 text-black";
        
        if (conditions.includes("chuva") || conditions.includes("moderada"))
            return timeOfDay === "night" ? "bg-blue-900 text-white" : "bg-blue-500 text-white";
        
        if (conditions.includes("chuva") || conditions.includes("forte"))
            return timeOfDay === "night" ? "bg-blue-950 text-white" : "bg-blue-700 text-white";
        
        if (conditions.includes("trovoada"))
            return timeOfDay === "night" ? "bg-purple-900 text-white" : "bg-purple-600 text-white";
        
        if (conditions.includes("neve"))
            return timeOfDay === "night" ? "bg-blue-300 text-black" : "bg-gray-200 text-black";
        
        if (conditions.includes("neblina") || conditions.includes("névoa"))
            return timeOfDay === "night" ? "bg-gray-700 text-white" : "bg-gray-400 text-black";
        
        if (conditions.includes("chuvisco"))
            return timeOfDay === "night" ? "bg-blue-800 text-white" : "bg-blue-300 text-black";
        
        if (conditions.includes("pó em suspensão"))
            return timeOfDay === "night" ? "bg-yellow-900 text-white" : "bg-yellow-600 text-black";
        
        return "bg-gray-700 text-white"; // Padrão caso não encontre uma condição
    };
    
    
    return (
        <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-400">Clima</h1>
        <input
        type="text"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Digite sua cidade"
        className="border rounded p-2 text-gray-800 w-full mt-2"
        />
        <button
        onClick={fetchWeatherData}
        className="ml-2 bg-gray-500 text-white p-2 rounded mt-2"
        >
        Ver Clima
        </button>
        
        {error && <p className="text-red-500 mt-4">{error}</p>}
        
        {weatherData && (
            <div className={`grid grid-cols-2 mt-2 text-white p-1 rounded-lg shadow-md ${getBackgroundColor()}`}>
            <div className="justify-items-center">
            <h2 className="font-bold text-lg">{weatherData.city} - {weatherData.country}</h2>
            <img
            src={weatherData.weatherIcon}
            alt="Ícone do clima"
            className=""
            />
            <p>{weatherData.description}</p>
            <p>{weatherData.temperature}°C</p>
            </div>
            <div className="grid grid-rows-3 grid-cols-3 gap-2 text-center mt-2">
            {/* Temperaturas Mínima e Máxima */}
            <div className="col-span-3 grid grid-cols-2">
            <div>
            <p className="font-bold">{weatherData.tempMin}ºC</p>
            <p className="text-sm">Mínima</p>
            </div>
            <div>
            <p className="font-bold">{weatherData.tempMax}ºC</p>
            <p className="text-sm">Máxima</p>
            </div>
            </div>
            
            {/* Nascer e Pôr do Sol */}
            <div className="col-span-3 grid grid-cols-2">
            <div>
            <p className="font-bold">{weatherData.sunrise}</p>
            <p className="text-sm">Nascer do Sol</p>
            </div>
            <div>
            <p className="font-bold">{weatherData.sunset}</p>
            <p className="text-sm">Pôr do Sol</p>
            </div>
            </div>
            
            {/* Botão e Horário Local */}
            <div className="col-span-3 grid grid-cols-2">
            <p className="font-bold">Horário Local: {weatherData.date}</p>
            {weatherData && (
                <button
                onClick={() => setShowDetails(!showDetails)}
                className=" text-white px-4 py-2 rounded mt-1"
                >
                {showDetails ? "Esconder Informações" : "Mais Informações"}
                </button>
            )}
            </div>
            </div>
            </div>
        )}
        
        
        
        {weatherData && showDetails && (
            <div className="overflow-x-auto">
            <h2 className="text-white font-bold mb-2">Dados completos da API</h2>
            <table className="w-full border-collapse border border-gray-600 text-white">
            <thead>
            <tr className="bg-gray-800">
            <th className="border border-gray-600 px-4 py-2 text-left">Propriedade</th>
            <th className="border border-gray-600 px-4 py-2 text-left">Valor</th>
            </tr>
            </thead>
            <tbody>
            {Object.entries(weatherData).map(([key, value]) => (
                <tr key={key} className="bg-gray-700">
                <td className="border border-gray-600 px-4 py-2">{key}</td>
                <td className="border border-gray-600 px-4 py-2">{String(value)}</td>
                </tr>
            ))}
            </tbody>
            </table>
            </div>
        )}
        </div>
    );
};

export default WeatherComponent;
