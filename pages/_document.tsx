import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* PWA */}
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

        {/* Viewport e script do AdSense NÃO ficam mais aqui —
            o Next.js recomenda oficialmente não colocar viewport no _document.tsx
            (ver aviso: nextjs.org/docs/messages/no-document-viewport-meta).
            Ambos foram movidos para _app.tsx. */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}