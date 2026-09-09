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

        {/* Script do Google AdSense
            Inserido com tag nativa para evitar o erro "data-nscript" */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2852931130226129"
          crossOrigin="anonymous"
        ></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}