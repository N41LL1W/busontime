import React from 'react';
import HorariosPage from '../components/HorariosPage';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Home: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Cabeçalho */}
      <Header />

      {/* Conteúdo principal */}
      <main className="flex-grow p-4">
        <HorariosPage />
      </main>

      {/* Rodapé */}
      <Footer />
    </div>
  );
};

export default Home;
