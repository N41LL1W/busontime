// pages/about.tsx
import { Github, Linkedin, Twitter } from 'lucide-react';
import { GetStaticProps } from 'next';

export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};

// Este é o conteúdo da ABA "Sobre"
export default function AboutPage() {
  return (
    <div className="p-4 md:p-6 pb-20 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Sobre o Projeto</h1>
      <p className="text-muted-foreground mb-6">
        Este aplicativo foi desenvolvido para facilitar a vida de quem depende do transporte público na região, centralizando os horários de diversas fontes em um só lugar.
      </p>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold border-b pb-2">O Desenvolvedor</h2>
        <div className="flex items-center gap-4 pt-4">
          <div>
            <h3 className="text-xl font-bold">Seu Nome</h3>
            <p className="text-muted-foreground">Desenvolvedor Full-Stack</p>
          </div>
        </div>
        <p>
          Olá! Eu sou o criador deste app. Minha motivação foi resolver um problema real que eu e muitas outras pessoas enfrentamos diariamente.
        </p>

        <div className="flex space-x-4">
          <a href="https://github.com/seu-usuario" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Github size={24} />
          </a>
          <a href="https://linkedin.com/in/seu-usuario" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <Linkedin size={24} />
          </a>
          {/* Adicione outras redes se quiser */}
        </div>
      </div>
    </div>
  );
}