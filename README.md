# BusOnTime

!(https://github.com/N41LL1W/busontime/public/images/capa_readme_busontime.png)
<!-- Sugestão: Crie uma imagem de capa simples usando o Canva ou similar e substitua o link acima -->

Um aplicativo web moderno, rápido e responsivo para consulta de horários de ônibus, focado em centralizar informações de diversas fontes de transporte público regional.

**[Acesse o App Online aqui!]** <!-- Coloque o link quando fizer o deploy -->

---

## 💡 Sobre o Projeto

O transporte público em muitas cidades depende de informações de horários espalhadas por diversos sites, muitas vezes em formatos difíceis de usar (como imagens ou tabelas mal formatadas). Este projeto nasceu para resolver esse problema, oferecendo uma interface única, limpa e rápida para consultar todos os horários em um só lugar.

O aplicativo foi construído com uma arquitetura moderna, pensando em performance, escalabilidade e na melhor experiência para o usuário final, incluindo funcionalidades como Dark Mode e filtros inteligentes.

### ✨ Funcionalidades Principais

- **Busca Centralizada:** Consulte horários de diversas linhas e empresas em uma única interface.
- **Filtros Inteligentes:** Filtre os horários por data, hora, origem e destino. As opções de filtro se ajustam dinamicamente com base na sua seleção.
- **Interface Moderna:** Design limpo e responsivo que se adapta a celulares, tablets e desktops.
- **Dark Mode:** Tema escuro para conforto visual em ambientes com pouca luz.
- **Fonte dos Dados:** Transparência total! Cada horário exibe um link para a fonte original da informação (site ou imagem).
- **Performance:** Carregamento quase instantâneo da página principal graças à Geração de Site Estático (SSG) com o Next.js.

### 📸 Screenshots

<!-- TIRE UM PRINT DO SEU APP E COLOQUE AQUI! É MUITO IMPORTANTE. -->
<!-- Você pode arrastar a imagem para a caixa de texto do GitHub para fazer o upload. -->
<!-- Exemplo: -->
<!-- ![Screenshot do App](link_da_imagem_no_github.png) -->

[GIF ou Screenshot do App]

---

## 🛠️ Stack de Tecnologias

Este projeto foi construído com as seguintes tecnologias:

- **Frontend:**
  - [**Next.js**](https://nextjs.org/) (React Framework)
  - [**TypeScript**](https://www.typescriptlang.org/)
  - [**Tailwind CSS**](https://tailwindcss.com/)
  - [**shadcn/ui**](https://ui.shadcn.com/) (Componentes de UI)
- **Backend e Coleta de Dados:**
  - [**Node.js**](https://nodejs.org/)
  - [**Prisma**](https://www.prisma.io/) (ORM para interação com o banco de dados)
  - [**PostgreSQL**](https://www.postgresql.org/) (Banco de Dados) <!-- Troque se estiver usando outro, como SQLite -->
- **Ferramentas de Scraping:**
  - [**Cheerio**](https://cheerio.js.org/): Para parsing de HTML em sites estáticos.
  - [**Tesseract.js**](https://tesseract.projectnaptha.com/): Para reconhecimento óptico de caracteres (OCR) em imagens de horários.

---

## ⚙️ Arquitetura e Funcionamento do Código

O sistema é dividido em duas partes principais: o **Pipeline de Coleta de Dados (Backend)** e a **Aplicação Web (Frontend)**.

### 1. Pipeline de Coleta de Dados (ETL)

A coleta de dados não é feita em tempo real a cada acesso do usuário, o que seria lento e instável. Em vez disso, um processo automatizado (ETL - Extract, Transform, Load) é executado periodicamente para manter o banco de dados atualizado.

- **`scripts/run-scrapers.ts`**: Este é o **orquestrador** principal. Ele gerencia a execução de todos os scrapers. Utiliza `Promise.allSettled` para garantir que a falha de um scraper não interrompa os outros.

- **`scrapers/`**: Esta pasta contém os **módulos de extração**. Cada scraper é uma função pura responsável por uma única fonte de dados:
  - **`cheerio-*.ts`**: Scrapers que usam Axios e Cheerio para extrair dados de tabelas HTML em sites estáticos. São rápidos e eficientes.
  - **`ocr-from-image.ts`**: Um scraper robusto que usa Tesseract.js para extrair texto de imagens de horários, uma solução para as fontes de dados mais desafiadoras. Ele também tenta categorizar os horários por dia da semana e sentido da rota.

- **`lib/database-sync.ts`**: Contém a função `syncSchedules`. Ela recebe os dados raspados e os sincroniza com o banco de dados de forma **atômica** usando `prisma.$transaction`. Isso garante a consistência dos dados, evitando estados em que os horários antigos foram apagados mas os novos ainda não foram inseridos.

### 2. Aplicação Web (Next.js)

- **`pages/index.tsx`**: A página principal utiliza **`getStaticProps`**. Isso significa que a página é pré-renderizada no servidor com todos os horários já carregados. O resultado é um carregamento extremamente rápido para o usuário. A página é revalidada periodicamente (`revalidate`) para buscar novos dados sem a necessidade de um novo deploy.
  - **Injeção de Fonte:** É nesta etapa que a URL da fonte de cada horário é "injetada" nos dados, antes de serem passados para o frontend.

- **`components/BusScheduleFilter.tsx`**: O coração da interface. Este componente recebe a lista completa de horários e utiliza o hook `useMemo` para recalcular de forma performática a lista filtrada sempre que o usuário altera uma opção (data, origem, etc.), sem precisar de novas chamadas à API.

- **`pages/_app.tsx`**: Define o layout global da aplicação, incluindo o cabeçalho, o rodapé e a barra de navegação inferior, criando a sensação de um aplicativo nativo.

---

## 🚀 Como Rodar o Projeto Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/N41LL1W/seu-repositorio.git
    cd seu-repositorio
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    - Crie um arquivo `.env` na raiz do projeto.
    - Adicione a sua string de conexão com o banco de dados:
      ```env
      DATABASE_URL="postgresql://user:password@host:port/database"
      ```

4.  **Aplique as migrações do banco de dados:**
    ```bash
    npx prisma migrate dev
    ```

5.  **(Opcional) Popule o banco de dados com os horários mais recentes:**
    ```bash
    npm run scrape
    ```

6.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

---

## 👨‍💻 Sobre Mim

**Willian (N41LL1W)**

- **GitHub:** [@N41LL1W](https://github.com/N41LL1W)
- **LinkedIn:** (https://www.linkedin.com/in/willian-gomes-95800a183/)

Sinta-se à vontade para entrar em contato, dar sugestões ou contribuir com o projeto!
