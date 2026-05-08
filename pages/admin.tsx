import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import AdminScheduleManager from '../components/AdminScheduleManager';
import RaspagemButtons from '../components/RaspagemButtons';

const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'busontime2026';
const SESSION_KEY = 'busontime-admin-authenticated';

const Page = () => {
  const [autenticado, setAutenticado] = useState(false);
  const [login, setLogin] = useState(ADMIN_USER);
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    setAutenticado(window.sessionStorage.getItem(SESSION_KEY) === 'true');
  }, []);

  const handleLogin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (login.trim() === ADMIN_USER && senha === ADMIN_PASSWORD) {
      window.sessionStorage.setItem(SESSION_KEY, 'true');
      setAutenticado(true);
      setErro('');
      return;
    }

    setErro('Login ou senha incorretos. Confira as credenciais padrão exibidas abaixo ou configure NEXT_PUBLIC_ADMIN_USER/NEXT_PUBLIC_ADMIN_PASSWORD.');
  };

  const sair = () => {
    window.sessionStorage.removeItem(SESSION_KEY);
    setAutenticado(false);
    setSenha('');
  };

  return (
    <>
      <Head>
        <title>Admin - BusOnTime</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 pb-28">
        {!autenticado ? (
          <div className="mx-auto max-w-md rounded-2xl border bg-white p-6 shadow-sm dark:bg-zinc-900">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Área administrativa</p>
            <h1 className="mt-1 text-3xl font-bold">Entrar no painel</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Acesse digitando <strong>/admin</strong> na barra de endereço. As credenciais padrão foram atualizadas para facilitar o acesso.
            </p>

            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950 dark:text-blue-100">
              <p><strong>Login padrão:</strong> {ADMIN_USER}</p>
              <p><strong>Senha padrão:</strong> {ADMIN_PASSWORD}</p>
            </div>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <label className="block space-y-1 text-sm font-medium">
                Usuário
                <input
                  type="text"
                  value={login}
                  onChange={(event) => setLogin(event.target.value)}
                  className="w-full rounded border p-2 text-foreground"
                  autoComplete="username"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Senha
                <input
                  type="password"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  className="w-full rounded border p-2 text-foreground"
                  autoComplete="current-password"
                />
              </label>
              {erro && <p className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-100">{erro}</p>}
              <button type="submit" className="w-full rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                Entrar
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Painel do BusOnTime</p>
                <h1 className="text-3xl font-bold">Atualizar e configurar horários</h1>
                <p className="text-sm text-muted-foreground">
                  Primeiro tente puxar os horários oficiais. Se algo não bater com o Semiurbano/VSB, edite ou cadastre manualmente na tabela de conferência.
                </p>
              </div>
              <button type="button" onClick={sair} className="rounded border px-4 py-2 font-semibold hover:bg-gray-100 dark:hover:bg-zinc-800">
                Sair
              </button>
            </div>

            <RaspagemButtons />
            <AdminScheduleManager />
          </div>
        )}
      </div>
    </>
  );
};

export default Page;
