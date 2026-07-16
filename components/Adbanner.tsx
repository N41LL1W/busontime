"use client";

import { useEffect, useRef } from "react";

/**
 * AdBanner.tsx
 *
 * Componente de anúncio do Google AdSense.
 *
 * COMO ATIVAR:
 * 1. Crie uma conta em https://adsense.google.com
 * 2. Adicione o site (busontime.vercel.app ou seu domínio)
 * 3. Espere aprovação (pode levar dias/semanas)
 * 4. Depois de aprovado, troque os valores abaixo:
 *    - NEXT_PUBLIC_ADSENSE_CLIENT (ex: "ca-pub-1234567890123456")
 *    - slot (ID do bloco de anúncio criado no painel do AdSense)
 * 5. Adicione o script do AdSense no _document.tsx (ver instruções no final deste arquivo)
 *
 * Enquanto não aprovado, este componente não renderiza nada (retorna null),
 * então pode deixar ele espalhado pelo site sem quebrar nada.
 */

interface AdBannerProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "";

export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const carregado = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || carregado.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      carregado.current = true;
    } catch (err) {
      console.error("Erro ao carregar anúncio:", err);
    }
  }, []);

  // Sem client configurado (ainda não aprovado) — não renderiza nada
  if (!ADSENSE_CLIENT) return null;

  return (
    <div className={`w-full flex justify-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

/**
 * ── PASSO A PASSO COMPLETO ──────────────────────────────────────────────
 *
 * 1) Crie a variável de ambiente no Vercel:
 *    Settings > Environment Variables > NEXT_PUBLIC_ADSENSE_CLIENT = ca-pub-XXXXXXXXXXXXXXXX
 *
 * 2) No arquivo pages/_document.tsx, adicione dentro do <Head>:
 *
 *    <script
 *      async
 *      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
 *      crossOrigin="anonymous"
 *    />
 *
 * 3) Crie o arquivo public/ads.txt com o conteúdo que o AdSense fornecer
 *    (algo como: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0)
 *
 * 4) Use o componente onde quiser mostrar um anúncio:
 *    <AdBanner slot="1234567890" />
 *
 * 5) Cada "slot" é um bloco de anúncio diferente, criado no painel do AdSense
 *    (Anúncios > Por unidade de anúncio > Criar nova unidade)
 */