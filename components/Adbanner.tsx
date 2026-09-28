import { useEffect, useRef } from "react";

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

// ID do cliente hardcoded ou via variável de ambiente
const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-2852931130226129";

export default function AdBanner({ slot, format = "auto", className = "" }: AdBannerProps) {
  const adRef = useRef<HTMLModElement>(null);
  const carregado = useRef(false);

  useEffect(() => {
    if (carregado.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      carregado.current = true;
    } catch (err) {
      console.error("Erro ao carregar anúncio:", err);
    }
  }, []);

  return (
    <div className={`w-full min-h-[90px] flex justify-center items-center my-4 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: "90px" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}