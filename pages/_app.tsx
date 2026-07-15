import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import NavBar from '@/components/NavBar';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from '@/lib/reactQuery';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
import { Analytics } from '@vercel/analytics/react';

function MyApp({ Component, pageProps }: AppProps) {
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

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      initializeAdMob();
    }
  }, []);

  // Registra o Service Worker do PWA (só em produção e se o navegador suportar)
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('Service Worker registrado:', reg.scope))
        .catch((err) => console.error('Erro ao registrar Service Worker:', err));
    }
  }, []);

  const initializeAdMob = async () => {
    try {
      await AdMob.initialize();
      console.log('AdMob inicializado com sucesso.');
      showBannerAd();
    } catch (error) {
      console.error('Erro ao inicializar o AdMob:', error);
    }
  };

  const showBannerAd = async () => {
    const options: BannerAdOptions = {
      adId: 'ca-app-pub-3940256099942544/6300978111',
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 64,
      isTesting: true,
    };
    try {
      await AdMob.showBanner(options);
      console.log('Banner do AdMob deve estar visível.');
    } catch (error) {
      console.error('Erro ao exibir o banner do AdMob:', error);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </Head>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        <header className="flex justify-between items-center p-4 border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
          <h1 className="text-2xl font-bold">BusOnTime</h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            {darkMode ? "Claro" : "Escuro"}
          </button>
        </header>

        <main>
          <Component {...pageProps} />
        </main>
        <NavBar />
        <footer className="text-center p-4 pt-0 pb-20 text-sm text-muted-foreground space-y-1">
          <p>© {new Date().getFullYear()} BusOnTime</p>
          <Link href="/privacy" className="hover:text-primary hover:underline">
            Política de Privacidade
          </Link>
        </footer>
      </div>
      <Analytics />
    </QueryClientProvider>
  );
}

export default MyApp;