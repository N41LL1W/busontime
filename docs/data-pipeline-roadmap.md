# Roadmap técnico — atualização automática de horários e expansão de fontes

Este documento descreve uma evolução incremental do pipeline de scraping do BusOnTime para reduzir falhas, melhorar qualidade dos dados e facilitar a entrada de novas empresas/linhas na região de Ribeirão Preto-SP.

## 1) Situação atual (resumo)

- Coleta híbrida via HTML (Cheerio) e OCR de imagens (Tesseract).
- Orquestração central em `scripts/run-scrapers.ts` com jobs estáticos.
- Persistência via Prisma com sincronização por origem/destino/dia em `lib/database-sync.ts`.

## 2) Principais gargalos

1. **Fontes frágeis**: HTML muda e quebra parser; imagens degradam OCR.
2. **Baixa observabilidade**: difícil saber quando um job começou a falhar silenciosamente.
3. **Sem versionamento de captura**: pouco histórico para auditoria quando horário muda.
4. **Escalabilidade limitada**: adicionar nova empresa exige editar código e publicar.

## 3) Arquitetura alvo (em fases)

### Fase A — Robustez operacional (curto prazo)

- Criar tabela `DataSource` (empresa, URL, tipo: HTML/OCR/PDF/API, ativo).
- Criar tabela `SyncRun` (jobId, data/hora, sucesso, duração, erro, contagem de registros).
- Criar tabela `RawSnapshot` (hash do conteúdo bruto, referência à fonte, data de captura).
- Adicionar **timeout + retry com backoff** por job.
- Adicionar **alerta mínimo** (log estruturado + webhook/Discord).

### Fase B — Qualidade e normalização (médio prazo)

- Pipeline em etapas: `fetch -> parse -> validate -> normalize -> upsert`.
- Normalizar campos críticos:
  - cidade/origem/destino (dicionário canônico)
  - diaDaSemana (enum)
  - horário (`HH:mm`)
- Regras de validação:
  - rejeitar horários inválidos
  - marcar duplicidade por chave lógica
  - bloquear quedas bruscas (ex.: de 40 horários para 2)

### Fase C — Escala de integração (médio/longo prazo)

- Estrutura de **adaptadores por fonte** com interface única:
  - `fetch()`
  - `parse(raw)`
  - `mapToCanonical(data)`
- Cadastro de rotas/fonte por configuração em DB (evitar hardcode de `scrapingJobs`).
- Execução seletiva (por empresa, cidade, linha) via CLI.

## 4) Estratégias para novas fontes

Prioridade de ingestão (mais confiável para menos confiável):

1. **GTFS/GTFS-RT** (quando existir)
2. **API oficial**
3. **PDF com tabela estruturada**
4. **HTML tabular**
5. **Imagem/OCR** (último recurso)

Para cada nova empresa:

- mapear se existe portal com arquivo estruturado (CSV/PDF/API)
- definir `sourceType`
- implementar adapter específico
- adicionar testes de parsing com snapshots reais

## 5) Melhorias recomendadas no código atual

1. Em `scripts/run-scrapers.ts`:
   - mover `scrapingJobs` para configuração (DB ou JSON versionado)
   - executar em lotes com limite de concorrência
   - registrar métricas por job (`SyncRun`)

2. Em `lib/database-sync.ts`:
   - substituir delete+insert global por upsert com chave composta lógica
   - manter histórico de versões de horário
   - registrar diffs (quantos horários entraram/saíram)

3. Em scrapers OCR:
   - pré-processar imagem (contraste, binarização, recorte)
   - validar manualmente amostras de baixa confiança
   - persistir texto OCR bruto para auditoria

## 6) Agendamento e automação

- Agendar execução 2x ao dia (manhã/noite) e on-demand.
- Rodar “full refresh” semanal e “delta refresh” diário.
- Cache de requisições por hash para evitar processamento repetido.

## 7) Segurança e conformidade

- Respeitar `robots.txt` e termos de uso de cada site.
- Identificar User-Agent do coletor.
- Implementar rate limit por domínio.

## 8) Checklist prático (próximos passos)

1. Criar migrações Prisma para `DataSource`, `SyncRun`, `RawSnapshot`.
2. Extrair interface comum de adapters e migrar 1 fonte HTML + 1 OCR.
3. Instrumentar logs estruturados + status por job.
4. Implementar validações e bloqueio de regressão severa.
5. Tirar `scrapingJobs` do código e carregar do banco.

---

## Resultado esperado

Com essas mudanças, o projeto passa de um scraping “artesanal” para uma plataforma de ingestão confiável, auditável e pronta para crescer com novas linhas e empresas da região.
