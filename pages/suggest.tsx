// pages/suggest.tsx
import React, { useState } from 'react';
import { GetStaticProps } from 'next';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Head from 'next/head';

export const getStaticProps: GetStaticProps = async () => {
  return { props: {} };
};

export default function SuggestPage() {
  const [cidade, setCidade] = useState('');
  const [link, setLink] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const email = "busontime001@gmail.com"; // <-- TROQUE PELO SEU EMAIL
    const subject = encodeURIComponent(`Sugestão de Horário: ${cidade}`);
    const body = encodeURIComponent(
      `Olá,
      
      Gostaria de sugerir a adição dos horários da cidade/região: ${cidade}.
      
      Encontrei os horários no seguinte link (se aplicável):
      ${link}
      
      Informações adicionais:
      ${mensagem}
      
      Obrigado!
      `
    );
    
    // Abre o cliente de e-mail do usuário
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Head>
        <title>Sugerir Horários - BusOnTime</title>
        <meta name="description" content="Ajude-nos a melhorar! Envie sugestões de novas linhas e horários de ônibus." />
      </Head>
      <div className="p-4 md:p-6 pb-24 max-w-2xl mx-auto">
        <div className="mb-6 text-center md:text-left">
          <h1 className="text-3xl font-bold">Ajude a Melhorar o App</h1>
          <p className="text-muted-foreground mt-2">
            Encontrou uma linha de ônibus que não está aqui? Envie sua sugestão! Todas as contribuições são bem-vindas e ajudam a comunidade.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cidade">Cidade ou Rota</Label>
            <Input 
              id="cidade"
              type="text"
              placeholder="Ex: Ribeirão Preto -> Cravinhos"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              required 
            />
            <p className="text-xs text-muted-foreground">Qual cidade ou trajeto você gostaria de ver no app?</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link da Fonte (Opcional)</Label>
            <Input 
              id="link"
              type="url"
              placeholder="https://site.da.empresa/horarios"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Se você sabe onde encontrar os horários (site da empresa, imagem, etc.), cole o link aqui.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem Adicional (Opcional)</Label>
            <Textarea 
              id="mensagem"
              placeholder="Qualquer outra informação útil, como o nome da empresa de ônibus."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </div>
          
          <Button type="submit" className="w-full">
            Enviar Sugestão por E-mail
          </Button>
        </form>
      </div>
    </>
  );
}
