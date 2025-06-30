// pages/privacy.tsx
import React from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';

export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};

export default function PrivacyPolicyPage() {
  const privacyPolicyUrl = "https://www.termsfeed.com/live/be2088e0-9fa1-4892-8a8a-6295ee696711";

  return (
    <>
      <Head>
        <title>Política de Privacidade - BusOnTime</title>
      </Head>
      <div className="p-4 md:p-6 pb-24 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-6">
          Sua privacidade é importante para nós. Esta página contém a nossa política de privacidade oficial, hospedada na plataforma TermsFeed. Para uma melhor visualização e para garantir que você esteja lendo a versão mais atualizada, recomendamos acessá-la através do link oficial.
        </p>

        <div className="my-8">
          <a
            href={privacyPolicyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Ver Política de Privacidade Completa
          </a>
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
            <h2>Por que temos esta página?</h2>
            <p>
                Para cumprir os requisitos da Google Play Store e de outras plataformas, é necessário que a política de privacidade seja facilmente acessível dentro do próprio aplicativo. Esta página serve como um ponto de acesso direto para o documento oficial.
            </p>
            <h2>Coleta e Uso de Dados</h2>
            <p>
                Nosso aplicativo utiliza o Google AdMob para exibir anúncios, que pode coletar dados anônimos para personalizar a publicidade. Não coletamos ou armazenamos informações de identificação pessoal dos nossos usuários. Para mais detalhes, por favor, consulte a política completa no link acima.
            </p>
        </div>
      </div>
    </>
  );
}