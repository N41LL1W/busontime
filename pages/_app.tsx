// pages/_app.tsx
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import NavBar from '@/components/NavBar'; // Certifique-se de que o caminho esteja correto
import { useEffect, useState } from 'react';

// O componente que criamos antes para a navegação
// Garanta que ele exista em components/NavBar.tsx
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { Home, Info } from 'lucide-react';
// const navItems = [ { href: '/', label: 'Horários', icon: Home }, { href: '/about', label: 'Sobre', icon: Info } ];
// ... (código completo do NavBar.tsx)

function MyApp({ Component, pageProps }: AppProps) {
  // A lógica do Dark Mode agora vive aqui para ser global
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDarkModePreferred = window.localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkModePreferred);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) {
      html.classList.add("dark");
      window.localStorage.setItem('darkMode', 'true');
    } else {
      html.classList.remove("dark");
      window.localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* CABEÇALHO GLOBAL */}
      <header className="flex justify-between items-center p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold">Horários de Ônibus</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          {darkMode ? "Modo Claro" : "Modo Escuro"}
        </button>
      </header>
      
      {/* CONTEÚDO DA PÁGINA ATUAL (index.tsx ou about.tsx) */}
      <main>
        <Component {...pageProps} />
      </main>

      {/* BARRA DE NAVEGAÇÃO COM AS ABAS */}
      <NavBar />

      {/* RODAPÉ GLOBAL (OPCIONAL) */}
      <footer className="text-center p-4 pt-0 pb-20 text-sm text-muted-foreground">
        © {new Date().getFullYear()} BusOnTime
      </footer>
    </div>
  );
}

export default MyApp;