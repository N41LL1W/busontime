import React from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import HorariosPage from '../components/HorariosPage';
import Footer from '../components/Footer';
import Header from '../components/Header';

const Page = () => {
  const mutationRibeiraoJardinopolis = useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await axios.post('/api/scrap-ribeirao-jardinopolis');
      return response.data.message;
    },
  });

  const mutationLinha01 = useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await axios.post('/api/scrap-jardinopolis-ribeirao');
      return response.data.message;
    },
  });

  const mutationRibeiraoBrodowski = useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await axios.post('/api/scrap-ribeirao-brodowski');
      return response.data.message;
    },
  });

  // ✅ NOVA MUTATION: Brodowski - Ribeirão Preto
  const mutationBrodowskiRibeirao = useMutation({
    mutationFn: async (): Promise<string> => {
      const response = await axios.post('/api/scrap-brodowski-ribeirao');
      return response.data.message;
    },
  });

  return (
    <div>
      <div className='mb-10 pb-10'>
        <Header />
      </div>

      <h1>Bem-vindo ao sistema de raspagem de horários!</h1>

      <div className="buttons flex flex-col gap-4 mt-4 max-w-lg mx-auto">

        {/* Botão 1 */}
        <button
          onClick={() => mutationRibeiraoJardinopolis.mutate()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          disabled={mutationRibeiraoJardinopolis.status === 'pending'}
        >
          {mutationRibeiraoJardinopolis.status === 'pending' ? 'Raspando...' : 'Raspagem Ribeirão-Jardinópolis'}
        </button>
        {mutationRibeiraoJardinopolis.status === 'error' && (
          <p className="text-red-500">Erro ao tentar raspar dados.</p>
        )}
        {mutationRibeiraoJardinopolis.status === 'success' && (
          <p className="text-green-500">{mutationRibeiraoJardinopolis.data}</p>
        )}

        {/* Botão 2 */}
        <button
          onClick={() => mutationLinha01.mutate()}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          disabled={mutationLinha01.status === 'pending'}
        >
          {mutationLinha01.status === 'pending' ? 'Raspando...' : 'Raspagem Jardinópolis-Ribeirão'}
        </button>
        {mutationLinha01.status === 'error' && (
          <p className="text-red-500">Erro ao tentar raspar dados.</p>
        )}
        {mutationLinha01.status === 'success' && (
          <p className="text-green-500">{mutationLinha01.data}</p>
        )}

        {/* Botão 3: Ribeirão Preto - Brodowski */}
        <button
          onClick={() => mutationRibeiraoBrodowski.mutate()}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400"
          disabled={mutationRibeiraoBrodowski.status === 'pending'}
        >
          {mutationRibeiraoBrodowski.status === 'pending'
            ? 'Raspando...'
            : 'Raspagem Ribeirão - Brodowski'}
        </button>
        {mutationRibeiraoBrodowski.status === 'error' && (
          <p className="text-red-500">Erro ao tentar raspar dados.</p>
        )}
        {mutationRibeiraoBrodowski.status === 'success' && (
          <p className="text-green-500">{mutationRibeiraoBrodowski.data}</p>
        )}

        {/* ✅ Botão 4: Brodowski - Ribeirão Preto */}
        <button
          onClick={() => mutationBrodowskiRibeirao.mutate()}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-400"
          disabled={mutationBrodowskiRibeirao.status === 'pending'}
        >
          {mutationBrodowskiRibeirao.status === 'pending'
            ? 'Raspando...'
            : 'Raspagem Brodowski - Ribeirão'}
        </button>
        {mutationBrodowskiRibeirao.status === 'error' && (
          <p className="text-red-500">Erro ao tentar raspar dados.</p>
        )}
        {mutationBrodowskiRibeirao.status === 'success' && (
          <p className="text-green-500">{mutationBrodowskiRibeirao.data}</p>
        )}

        {/* ✅ Botão de Atualizar Tabela */}
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
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
