// lib/db.js
import { Pool } from 'pg';

let pool; // Declaramos a variável pool fora para que ela persista entre as chamadas

// Função para garantir que temos apenas uma instância do pool
function getPool() {
  if (!pool) {
    console.log('Criando novo pool de conexões com o PostgreSQL...');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL, // Pega da Vercel ou .env.local
      ssl: {
        rejectUnauthorized: false, // Necessário para Neon
      },
      // Você pode adicionar outras configurações do pool aqui, se necessário:
      // max: 20, // Número máximo de clientes no pool
      // idleTimeoutMillis: 30000, // Quanto tempo um cliente pode ficar ocioso antes de ser fechado
      // connectionTimeoutMillis: 2000, // Quanto tempo para esperar por uma conexão antes de falhar
    });

    // Opcional: Adicionar um listener para erros no pool (bom para debugging)
    pool.on('error', (err, client) => {
      console.error('Erro inesperado em cliente ocioso do pool', err);
      // Em um app de produção, você pode querer tentar recriar o pool ou sair do processo
      // process.exit(-1);
    });
  }
  return pool;
}

// Exportamos a instância do pool já inicializada ou a função que a retorna.
// Exportar diretamente o resultado da função é comum para garantir que o pool é criado
// na primeira vez que este módulo é importado.
export default getPool();

// Alternativa (se preferir chamar a função explicitamente):
// export { getPool };
// E nos arquivos de API: import { getPool } from '../../lib/db'; const pool = getPool();