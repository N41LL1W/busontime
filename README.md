# BUSONTIME

O **BUSONTIME** é uma aplicação web para consulta de horários de transporte suburbano. Ele utiliza tecnologias modernas como Next.js, React Query e Tailwind CSS, permitindo a raspagem, exibição e atualização de dados de maneira prática e eficiente.

## Tecnologias Utilizadas

- **Next.js**: Framework React para criação de aplicações web otimizadas.
- **React Query**: Gerenciamento de estado assíncrono e cache para requisições.
- **Tailwind CSS**: Framework de estilização baseado em utilitários.
- **TypeScript**: Superset do JavaScript para maior segurança no desenvolvimento.
- **Prisma**: ORM para comunicação com banco de dados PostgreSQL.
- **Neon**: Banco de dados PostgreSQL remoto.

## Funcionalidades

- Consulta de horários de transporte suburbano.
- Atualização dos horários por meio de raspagem de dados.
- Interface responsiva e amigável.
- Ajuste do horário local baseado no timezone retornado pela API de clima.
- Exibição de informações detalhadas da API de clima ao clicar no botão "Mais Informações".

## Configuração do Projeto

### Instalação

Clone o repositório:
```bash
git clone <URL_DO_REPOSITORIO>
cd busontime
```

Instale as dependências:
```bash
npm install
```

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

### Configuração do React Query

O **QueryClient** foi configurado no arquivo `pages/_app.tsx` para gerenciar o estado global de requisições.

### Estrutura do Projeto

- `/components`: Componentes reutilizáveis como tabelas, botões e exibição de dados de clima.
- `/pages`: Páginas da aplicação.
- `/styles`: Arquivos de estilização.
- `/lib`: Configurações adicionais como o Prisma.
- `/scrap`: Scripts de raspagem de horários de transporte.

## Como Contribuir

1. Faça um **fork** do repositório.
2. Crie uma **branch** para sua feature/bugfix:
   ```bash
   git checkout -b minha-feature
   ```
3. Faça o **commit** de suas alterações:
   ```bash
   git commit -m "Descrição da minha feature"
   ```
4. Envie suas alterações:
   ```bash
   git push origin minha-feature
   ```
5. Abra um **Pull Request** no repositório original.

## Licença

Este projeto está licenciado sob a licença **MIT**.

## Próximas Etapas

- Implementar autenticação de usuários.
- Adicionar filtro avançado de horários por itinerário.
- Criar documentação para a API.
- Melhorar a interface de exibição dos dados climáticos.
- Implementar cache local para otimizar as consultas de clima.
