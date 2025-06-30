# BusOnTime - Horários de Ônibus Simplificados

![BusOnTime Cover](https://via.placeholder.com/1200x630.png/020617/FFFFFF?text=BusOnTime%20App) 
<!-- TODO: Substitua o placeholder por uma imagem de capa real -->

Um aplicativo moderno e de código aberto para consulta de horários de ônibus, projetado para centralizar informações de transporte público e oferecer uma experiência de usuário limpa, rápida e confiável.

**[Acesse na Google Play Store!]** <!-- Link a ser adicionado após a publicação -->
**[Acesse a Versão Web!]** <!-- Link da sua Vercel -->

---

## 🎯 O Problema

Em muitas cidades, os horários de ônibus são disponibilizados de forma descentralizada e em formatos pouco práticos, como imagens de baixa qualidade, tabelas em sites desatualizados ou PDFs difíceis de navegar em um celular. Encontrar uma informação simples se torna uma tarefa frustrante.

## ✨ A Solução: BusOnTime

BusOnTime ataca esse problema de frente, oferecendo:

- **Centralização:** Todos os horários de diversas fontes em um único lugar.
- **Interface Intuitiva:** Um design limpo e moderno, focado na facilidade de uso.
- **Performance:** Carregamento quase instantâneo e filtros que funcionam em tempo real.
- **Transparência:** Cada horário pode ser rastreado até sua fonte original, seja um site ou uma imagem.
- **Engajamento Comunitário:** Uma seção de sugestões permite que os próprios usuários ajudem a expandir a base de dados.

### 📸 Screenshots

<!-- TODO: Adicione aqui os screenshots do seu aplicativo. -->
<!-- Exemplo: -->
<!-- 
<p align="center">
  <img src="link_do_screenshot_1.png" width="200" />
  <img src="link_do_screenshot_2.png" width="200" />
  <img src="link_do_screenshot_3.png" width="200" />
</p> 
-->


---

## 🛠️ Stack de Tecnologias & Arquitetura

O projeto foi construído com uma abordagem moderna e desacoplada, separando a coleta de dados da interface do usuário.

- **Frontend:**
  - **Next.js (React):** Para uma renderização performática e estrutura de app.
  - **TypeScript:** Para um código mais seguro e manutenível.
  - **Tailwind CSS & shadcn/ui:** Para uma UI bonita e customizável.
  - **Capacitor:** Para "empacotar" a aplicação web em um aplicativo Android nativo.

- **Backend (Pipeline de Dados):**
  - **Node.js:** Ambiente de execução dos scripts.
  - **Scrapers Dedicados:** Funções isoladas que usam **Cheerio** (para HTML) e **Tesseract.js** (para OCR de imagens) para extrair dados das fontes.
  - **Orquestrador Central (`run-scrapers.ts`):** Um script mestre que gerencia a execução de todos os scrapers de forma robusta.
  - **Prisma ORM & PostgreSQL:** Para armazenar e gerenciar os dados coletados de forma eficiente.

- **Fluxo de Dados:**
  1. O **Orquestrador** executa os **Scrapers** periodicamente (via automação).
  2. Os dados são limpos, formatados e salvos no banco de dados **PostgreSQL** pelo **Prisma**.
  3. A aplicação **Next.js** usa `getStaticProps` para pré-renderizar as páginas com os dados do banco durante o `build`, garantindo um carregamento ultrarrápido.
  4. O app final é empacotado pelo **Capacitor** e publicado na Google Play Store.

---

## 🚀 Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/N41LL1W/busontime.git
    cd busontime
    ```
2.  **Instale as dependências:** `npm install`
3.  **Configure o `.env`** com a sua `DATABASE_URL`.
4.  **Rode as migrações do banco:** `npx prisma migrate dev`
5.  **(Opcional) Popule o banco com dados:** `npm run scrape`
6.  **Inicie o servidor web:** `npm run dev`

---

## 🔮 Próximos Passos e Visão de Futuro

- [ ] Implementar compras no app para remover anúncios (versão Premium).
- [ ] Adicionar funcionalidade de "horários favoritos".
- [ ] Notificações push para alertar sobre mudanças nos horários.
- [ ] Suporte para a plataforma iOS.
- [ ] Criar um painel de administração para gerenciar as fontes de scraping.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Contato

**Willian (N41LL1W)**

[GitHub](https://github.com/N41LL1W) • [LinkedIn](https://www.linkedin.com/in/seu-usuario-aqui/)