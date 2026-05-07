import Head from "next/head";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SemiurbanoConfigPanel from "../components/SemiurbanoConfigPanel";

export default function ConfigPage() {
  return (
    <>
      <Head>
        <title>Config - Raspagem Semiurbano</title>
        <meta
          name="description"
          content="Configuração de raspagem do site Semiurbano São Bento e sincronização com o banco de dados."
        />
      </Head>
      <Header />
      <SemiurbanoConfigPanel />
      <Footer />
    </>
  );
}
