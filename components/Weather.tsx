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
                sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString("pt-BR"),
                sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString("pt-BR"),
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
        if (!weatherData) return "bg-gray-700";
        
        const utcTime = Math.floor(Date.now() / 1000) + new Date().getTimezoneOffset() * 60;
        const localDate = new Date((utcTime + weatherData.timezone) * 1000);
        const hour = localDate.getHours();
        
        let timeOfDay = "day";
        if (hour >= 18 || hour < 6) timeOfDay = "night";
        else if (hour >= 12) timeOfDay = "afternoon";
        
        
        const conditions = weatherData.description.toLowerCase();
        if (conditions.includes("céu limpo")) return timeOfDay === "night" ? "bg-sky-800" : "bg-orange-300";
        if (conditions.includes("nublado")) return timeOfDay === "night" ? "bg-zinc-800" : "bg-zinc-400";
        if (conditions.includes("nuvens")) return timeOfDay === "night" ? "bg-zinc-600" : "bg-zinc-200";
        if (conditions.includes("chuva")) return timeOfDay === "night" ? "bg-slate-800" : "bg-slate-500";
        if (conditions.includes("tempestade")) return timeOfDay === "night" ? "bg-stone-900" : "bg-rose-950";
        
        return "bg-yellow-500";
    };
    
    return (
        <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-white">Clima</h1>
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
            <div className={`grid grid-cols-2 mt-4 text-white p-4 rounded-lg shadow-md ${getBackgroundColor()}`}>
            <div className="justify-items-center">
            <h2 className="font-bold text-lg">{weatherData.city} - {weatherData.country}</h2>
            <img
            src={weatherData.weatherIcon}
            alt="Ícone do clima"
            className="w-100% h-100% mx-auto"
            />
            <p>{weatherData.description}</p>
            <p>{weatherData.temperature}°C</p>
            </div>
            <div className="justify-items-start">
            <p>Minima: {weatherData.tempMin}</p>
            <p>Maxima: {weatherData.tempMax}</p>
            <p>Nascer do Sol: {weatherData.sunrise}</p>
            <p>Por do Sol: {weatherData.sunset}</p>
            <p>Horário Local: {weatherData.date}</p>
            </div>
            </div>
        )}
        
        {weatherData && (
            <button
            onClick={() => setShowDetails(!showDetails)}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
            >
            {showDetails ? "Esconder Informações" : "Mais Informações"}
            </button>
        )}
        
        {weatherData && showDetails && (
            <div className="mt-6 overflow-x-auto">
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
