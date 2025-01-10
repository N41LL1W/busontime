import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-500 text-white py-4">
      <div className="container mx-auto flex justify-between items-center px-4">
        <h1 className="text-xl font-bold">BUSONTIME</h1>
        <p className="text-sm">Sistema de Horários de Transporte</p>
      </div>
    </header>
  );
};

export default Header;
