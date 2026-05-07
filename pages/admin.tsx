import Head from 'next/head';
import React, { FormEvent, useEffect, useState } from 'react';
import HorariosPage from '../components/HorariosPage';
import RaspagemButtons from '../components/RaspagemButtons';

const ADMIN_SESSION_KEY = 'busontime-admin-authenticated';

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setAutenticado(window.localStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, senha }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login ou senha incorretos.');
      }

      window.localStorage.setItem(ADMIN_SESSION_KEY, 'true');
      setAutenticado(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Erro ao tentar entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
    setAutenticado(false);
    setSenha('');
  };

  return (
    <>
      <Head>
        <title>Admin - BusOnTime</title>
        <meta name="description" content="Painel administrativo do BusOnTime para atualizar horários e raspagens." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-white px-4 py-8 pb-24 md:px-6">
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <section className="overflow-hidden rounded-[2rem] border bg-white shadow-xl">
            <div className="grid gap-6 bg-gradient-to-r from-green-600 via-green-700 to-green-950 p-6 text-white md:grid-cols-[1.4fr_0.6fr] md:p-10">
              <div className="space-y-4">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]">Admin</span>
                <h1 className="text-3xl font-bold md:text-5xl">Painel BusOnTime</h1>
                <p className="max-w-2xl text-sm text-green-50 md:text-base">
                  Gerencie a atualização dos horários, acompanhe as tabelas cadastradas e rode as raspagens das fontes ativas com o mesmo visual limpo da home.
                </p>
              </div>
              <div className="flex items-center justify-center rounded-3xl bg-white/10 p-4">
                <img src="/images/logoBusontime-rbg.png" alt="Logo BusOnTime" className="max-h-40 object-contain" />
              </div>
            </div>
          </section>

          {!autenticado ? (
            <section className="mx-auto max-w-md rounded-[2rem] border bg-white p-6 shadow-lg md:p-8">
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-950">Login de administrador</h2>
                <p className="mt-2 text-sm text-muted-foreground">Entre para liberar as ações de raspagem e manutenção das tabelas.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Usuário
                  <input
                    type="text"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    className="mt-1 w-full rounded-xl border px-3 py-2 outline-none ring-green-600 transition focus:ring-2"
                    autoComplete="username"
                    required
                  />
                </label>
                <label className="block text-sm font-medium text-gray-700">
                  Senha
                  <input
                    type="password"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                    className="mt-1 w-full rounded-xl border px-3 py-2 outline-none ring-green-600 transition focus:ring-2"
                    autoComplete="current-password"
                    required
                  />
                </label>

                {erro && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

                <button type="submit" disabled={loading} className="w-full rounded-xl bg-green-700 px-4 py-2 font-semibold text-white hover:bg-green-800 disabled:bg-gray-400">
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
              </form>
            </section>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col justify-between gap-3 rounded-3xl border bg-white p-4 shadow-sm md:flex-row md:items-center">
                <div>
                  <p className="font-semibold text-gray-950">Sessão administrativa ativa</p>
                  <p className="text-sm text-muted-foreground">Você já pode atualizar as fontes e revisar a tabela geral.</p>
                </div>
                <button onClick={handleLogout} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50">Sair</button>
              </div>

              <div className="rounded-[2rem] border bg-white p-4 shadow-lg md:p-6">
                <RaspagemButtons />
              </div>

              <div className="rounded-[2rem] border bg-white p-4 shadow-lg md:p-6">
                <HorariosPage />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
