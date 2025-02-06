import React from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

const HomePage = () => {
  // Definindo os tipos corretamente
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

  return (
    <div>
      <h1>Bem-vindo ao sistema de raspagem de horários!</h1>
      <div className="buttons flex gap-4 mt-4">
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

        <button
          onClick={() => mutationLinha01.mutate()}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
          disabled={mutationLinha01.status === 'pending'}
        >
          {mutationLinha01.status === 'pending' ? 'Raspando...' : 'Raspagem Jardinópolis-Ribeirão'}
        </button>
        {mutationLinha01.status === 'error' && <p className="text-red-500">Erro ao tentar raspar dados.</p>}
        {mutationLinha01.status === 'success' && <p className="text-green-500">{mutationLinha01.data}</p>}
      </div>
    </div>
  );
};

export default HomePage;
