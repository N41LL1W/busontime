import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-green-800 text-white py-4 fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="container flex items-center ml-10 my-0">
        <img
          src="/images/logoBusontime-rbg.png"  // Substitua pelo caminho da sua imagem
          alt="Logo BUSONTIME"
          className="w-12"  // Define a altura da imagem
        />
        <h1 className="text-xl font-bold px-4">BUSONTIME</h1>
        <p className="text-sm">Sistema de Horários de Transporte</p>
      </div>
    </header>
  );
};

export default Header;