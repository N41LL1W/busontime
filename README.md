# BUSONTIME

O **BUSONTIME** é uma aplicação web para consulta de horários de transporte suburbano. Ele utiliza tecnologias modernas como **Next.js**, **React Query**, e **Tailwind CSS**, permitindo a raspagem, exibição e atualização de dados de maneira prática e eficiente.

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

## Configuração do Projeto

### Instalação

1. Clone o repositório:
   ```bash
   git clone <URL_DO_REPOSITORIO>
   cd busontime
Instale as dependências:

bash
Copiar código
npm install
Inicie o servidor de desenvolvimento:

bash
Copiar código
npm run dev
Configuração do React Query
O QueryClient foi configurado no arquivo pages/_app.tsx para gerenciar o estado global de requisições.

Estrutura do Projeto
/components: Componentes reutilizáveis como tabelas e botões.
/pages: Páginas da aplicação.
/styles: Arquivos de estilização.
/lib: Configurações adicionais como o Prisma.
Como Contribuir
Faça um fork do repositório.
Crie uma branch para sua feature/bugfix:
bash
Copiar código
git checkout -b minha-feature
Faça o commit de suas alterações:
bash
Copiar código
git commit -m "Descrição da minha feature"
Envie suas alterações:
bash
Copiar código
git push origin minha-feature
Depois, abra um Pull Request no repositório original.

Licença
Este projeto está licenciado sob a licença MIT.

Próximas Etapas
Implementar autenticação de usuários.
Adicionar filtro avançado de horários por itinerário.
Criar documentação para a API.