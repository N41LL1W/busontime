import React from 'react';
import HorariosPage from '../components/HorariosPage';
import Footer from '../components/Footer';
import Header from '../components/Header';
import RaspagemButtons from '../components/RaspagemButtons';

const Page = () => {
  return (
    <div>
      <div className='mb-10 pb-10'>
        <Header />
      </div>

      <h1>Bem-vindo ao sistema de raspagem de horários!</h1>

      {/* ✅ Botões agrupados */}
      <div className="flex flex-col items-center mt-4">
        <RaspagemButtons />

        {/* ✅ Botão de Atualizar Tabela */}
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 mt-4"
        >
          Atualizar Tabela
        </button>
      </div>

      <div className='mb-20'>
        <HorariosPage />
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Page;
