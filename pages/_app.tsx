// pages/_app.tsx
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import NavBar from '@/components/NavBar';
import { useEffect, useState } from 'react';

import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';

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

  const initializeAdMob = async () => {
    try {
      // CORREÇÃO: Chamada simplificada, que é mais compatível entre plataformas.
      await AdMob.initialize(); 
      console.log('AdMob inicializado com sucesso.');
      showBannerAd();
    } catch (error) {
      console.error('Erro ao inicializar o AdMob:', error);
    }
  };

  const showBannerAd = async () => {
    const options: BannerAdOptions = {
      adId: 'ca-app-pub-3940256099942544/6300978111', // ID de teste do Google
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

      <footer className="text-center p-4 pt-0 pb-20 text-sm text-muted-foreground">
        © {new Date().getFullYear()} BusOnTime
      </footer>
    </div>
  );
}

export default MyApp;