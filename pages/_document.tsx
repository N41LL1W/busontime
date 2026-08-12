import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* PWA */}
        <meta name="viewport" content="width=device-width, initial-scale=1" maximum-scale="1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BusOnTime" />

        {/* Ícones */}
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* O script do Google AdSense NÃO fica mais aqui —
            ele só carrega em páginas com conteúdo real, via _app.tsx,
            pra não violar a política de "anúncios em telas sem conteúdo" (ex: /admin-horarios) */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}