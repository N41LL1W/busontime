import React, { useState } from 'react';
import HorariosPage from '../components/HorariosPage';
import Footer from '../components/Footer';
import Header from '../components/Header';
import RaspagemButtons from '../components/RaspagemButtons';

const Page = () => {
  const [autenticado, setAutenticado] = useState(false);
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");

  const handleLogin = () => {
    if (login === "1234" && senha === "1234") {
      setAutenticado(true);
    } else {
      alert("Login ou senha incorretos");
    }
  };

  return (
    <div>
      <div className='mb-10 pb-10'>
        <Header />
      </div>

      {!autenticado ? (
        <div className="flex flex-col items-center mt-10 space-y-4">
          <h2 className="text-xl font-semibold">Login de Administrador</h2>
          <input
            type="text"
            placeholder="Usuário"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="border px-3 py-2 rounded"
          />
          <button
            onClick={handleLogin}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
          >
            Entrar
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-center text-2xl font-bold mt-4">Bem-vindo ao sistema de raspagem de horários!</h1>

          <div className="flex flex-col items-center mt-4">
            <RaspagemButtons />

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
        </>
      )}

      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Page;
