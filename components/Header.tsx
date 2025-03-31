import React, { useState, useEffect } from "react";

const Header: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setIsCollapsed(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-10 transition-all duration-300 flex items-center justify-between py-6 ${
        isCollapsed ? "h-14 bg-gradient-to-r from-green-500 via-green-700 to-green-900" : "h-36 bg-gradient-to-r from-green-500 via-green-700 to-green-900 flex-col"
      }`}>

        

        {/* Quando a barra for pequena, exibir o logo, navegação e seta de topo */}
        {isCollapsed && (
          <div className="flex items-center w-full">
              <img src="/images/logoBusontime-rbg.png" alt="Logo BUSONTIME" className="h-8 md:h-12" />
              <nav className="flex gap-6 text-white text-lg ml-12">
                <a href="/" className="hover:underline">HOME</a>
                <a href="/page" className="hover:underline">PAGE</a>
              </nav>
          </div>
        )}

        {/* Quando a barra for grande, exibir o nome e navegação centralizada abaixo */}
        {!isCollapsed && (
          <div className="text-white text-center">
            {/* Marca d'água */}
            <div className="absolute inset-0 flex items-center justify-start opacity-20 text-white text-7xl md:text-9xl font-bold pointer-events-none select-none">
              <img src="/images/logoBusontime-rbg.png" alt="Logo BUSONTIME" className="scale-50" />
            </div>
            <p className="text-sm mt-10">SISTEMA DE HORÁRIOS DO TRANSPORTE SUBURBANO</p>
            <nav className="flex justify-center gap-6 text-lg mt-2">
              <a href="/" className="hover:underline">HOME</a>
              <a href="/page" className="hover:underline">PAGE</a>
            </nav>
          </div>
        )}

        {/* Botão de scroll para topo */}
        <div className={`absolute right-4 top-3 transition-opacity duration-300 ${isCollapsed ? "opacity-100" : "opacity-0"}`}>
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} 
            className="text-white text-xl">
            ▲
          </button>
        </div>
      </div>

      {/* Ajuste do espaço abaixo da header */}
      <div className={isCollapsed ? "h-12" : "h-36"} />
    </>
  );
};

export default Header;
