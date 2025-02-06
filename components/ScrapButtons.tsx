import { useState } from "react";

const ScrapButtons = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleScrap = async (endpoint: string) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/${endpoint}`, { method: "POST" });
      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } catch (error) {
      setMessage("Erro inesperado ao iniciar a raspagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => handleScrap("scrap-ribeirao-jardinopolis")}
        className="px-4 py-2 bg-blue-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Raspando Ribeirão-Jardinópolis..." : "Raspar Ribeirão-Jardinópolis"}
      </button>

      <button
        onClick={() => handleScrap("scrap-outro-itinerario")}
        className="px-4 py-2 bg-green-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Raspando Outro Itinerário..." : "Raspar Outro Itinerário"}
      </button>

      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
  );
};

export default ScrapButtons;
