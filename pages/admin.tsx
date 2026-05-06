import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { ShieldCheck, Users, RefreshCw, Database } from 'lucide-react';
import HorariosPage from '../components/HorariosPage';
import RaspagemButtons from '../components/RaspagemButtons';

const ADMIN_USERS = [
  { username: 'admin', password: 'admin123', name: 'Administrador' },
  { username: 'busontime', password: 'bus2026', name: 'Equipe BusOnTime' },
];

const Page = () => {
  const [autenticado, setAutenticado] = useState(false);
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const usuarioLogado = useMemo(
    () => ADMIN_USERS.find((user) => user.username.toLowerCase() === login.trim().toLowerCase()),
    [login]
  );

  useEffect(() => {
    setAutenticado(window.sessionStorage.getItem('admin-authenticated') === 'true');
  }, []);

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedLogin = login.trim().toLowerCase();
    const user = ADMIN_USERS.find(
      (adminUser) => adminUser.username.toLowerCase() === normalizedLogin && adminUser.password === senha
    );

    if (user) {
      setErro('');
      setAutenticado(true);
      window.sessionStorage.setItem('admin-authenticated', 'true');
      return;
    }

    setErro('Login ou senha incorretos. Confira um dos usuários iniciais abaixo.');
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem('admin-authenticated');
    setAutenticado(false);
    setLogin('');
    setSenha('');
  };

  return (
    <>
      <Head>
        <title>Admin BusOnTime</title>
        <meta name="description" content="Painel administrativo para atualizar e conferir horários de ônibus." />
      </Head>

      <div className="flex min-h-[calc(100vh-9rem)] flex-col items-center bg-gradient-to-b from-background via-muted/30 to-background p-4 md:p-6 pb-24">
        <div className="w-full max-w-6xl space-y-6">
          <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
            <div className="relative bg-gradient-to-r from-emerald-500 via-green-700 to-green-900 p-6 text-primary-foreground md:p-8">
              <img
                src="/images/logoBusontime-rbg.png"
                alt="Logo BusOnTime"
                className="absolute -right-8 -top-10 h-44 w-44 object-contain opacity-20 md:right-8 md:h-56 md:w-56"
              />
              <div className="relative max-w-3xl space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  <ShieldCheck className="h-4 w-4" /> Área administrativa
                </span>
                <h1 className="text-3xl font-bold md:text-4xl">Painel BusOnTime</h1>
                <p className="text-sm text-white/85 md:text-base">
                  Atualize as raspagens, revise os dados salvos e acompanhe se os horários estão chegando corretamente no banco.
                </p>
              </div>
            </div>
          </section>

          {!autenticado ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
              <section className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
                <div className="mb-6 space-y-2">
                  <h2 className="text-2xl font-semibold">Entrar como administrador</h2>
                  <p className="text-sm text-muted-foreground">
                    Use um dos usuários iniciais cadastrados para acessar a atualização dos horários.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <label className="block space-y-2 text-sm font-medium">
                    Usuário
                    <input
                      type="text"
                      placeholder="admin"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-emerald-600"
                      autoComplete="username"
                    />
                  </label>
                  <label className="block space-y-2 text-sm font-medium">
                    Senha
                    <input
                      type="password"
                      placeholder="Digite a senha"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-emerald-600"
                      autoComplete="current-password"
                    />
                  </label>

                  {erro && <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                  >
                    Entrar no painel
                  </button>
                </form>
              </section>

              <aside className="rounded-3xl border bg-card p-6 shadow-sm md:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-600/10 p-3 text-emerald-700">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Usuários iniciais</h3>
                    <p className="text-sm text-muted-foreground">Credenciais temporárias para começar.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {ADMIN_USERS.map((user) => (
                    <div key={user.username} className="rounded-2xl border bg-muted/40 p-4 text-sm">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-muted-foreground">Usuário: <span className="font-mono text-foreground">{user.username}</span></p>
                      <p className="text-muted-foreground">Senha: <span className="font-mono text-foreground">{user.password}</span></p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 rounded-2xl bg-emerald-600/10 p-3 text-emerald-700 w-fit">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">Sessão</p>
                  <h2 className="text-xl font-semibold">{usuarioLogado?.name || 'Administrador'}</h2>
                </div>
                <div className="rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 rounded-2xl bg-emerald-600/10 p-3 text-emerald-700 w-fit">
                    <RefreshCw className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">Atualização</p>
                  <h2 className="text-xl font-semibold">Raspagens por rota</h2>
                </div>
                <div className="rounded-3xl border bg-card p-5 shadow-sm">
                  <div className="mb-3 rounded-2xl bg-emerald-600/10 p-3 text-emerald-700 w-fit">
                    <Database className="h-5 w-5" />
                  </div>
                  <p className="text-sm text-muted-foreground">Tabela</p>
                  <h2 className="text-xl font-semibold">Dados em tempo real</h2>
                </div>
              </section>

              <div className="flex justify-end">
                <button onClick={handleLogout} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-muted">
                  Sair do painel
                </button>
              </div>

              <RaspagemButtons onUpdated={() => setRefreshKey((key) => key + 1)} />
              <HorariosPage key={refreshKey} />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;
