# -*- coding: utf-8 -*-
"""
atualizar_tudo.py
Roda todos os scrapers, compara com o banco e atualiza se houver diferenças.

Uso manual:
  .venv\\Scripts\\python.exe atualizar_tudo.py

Flags:
  --forcar    Força atualização mesmo sem diferenças
  --apenas saobento|ribe|rapidodoeste   Roda só uma empresa

Agendamento (Windows Task Scheduler):
  Programa: C:\\...\\busontime\\.venv\\Scripts\\python.exe
  Argumentos: C:\\...\\busontime\\atualizar_tudo.py
  Pasta: C:\\...\\busontime
"""

import json
import hashlib
import subprocess
import sys
import datetime
import argparse
from pathlib import Path

LOG_FILE = Path("logs/atualizacoes.log")
HASH_FILE = Path("logs/hashes.json")

SCRAPERS = [
    {
        "id": "saobento",
        "nome": "Viação São Bento",
        "script": "scraper_saobento.py",
        "output": "public/horarios-saobento.json",
        "api": "/api/admin/scrape-saobento-lote",  # roda todas as rotas
    },
    {
        "id": "ribe",
        "nome": "Ribe Transporte",
        "script": "scraper_ribe.py",
        "output": "public/horarios-ribe.json",
        "api": "/api/admin/scrape-ribe",
    },
    {
        "id": "rapidodoeste",
        "nome": "Rápido d'Oeste",
        "script": "scraper_rapidodoeste.py",
        "output": "public/horarios-rapidodoeste.json",
        "api": "/api/admin/scrape-rapidodoeste",
    },
]

PYTHON = sys.executable  # usa o mesmo python que está rodando este script


def log(msg: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    linha = f"[{timestamp}] {msg}"
    print(linha)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(linha + "\n")


def calcular_hash(arquivo: Path) -> str | None:
    """Calcula hash SHA256 do conteúdo do JSON (sem pesquisado_em para ignorar timestamps)."""
    if not arquivo.exists():
        return None
    try:
        dados = json.loads(arquivo.read_text(encoding="utf-8"))
        # Remove campos de timestamp antes de calcular o hash
        dados.pop("pesquisado_em", None)
        if "linhas" in dados:
            for linha in dados["linhas"]:
                linha.pop("pesquisado_em", None)
        conteudo = json.dumps(dados, ensure_ascii=False, sort_keys=True)
        return hashlib.sha256(conteudo.encode()).hexdigest()
    except Exception:
        return None


def carregar_hashes() -> dict:
    if HASH_FILE.exists():
        try:
            return json.loads(HASH_FILE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def salvar_hashes(hashes: dict):
    HASH_FILE.parent.mkdir(parents=True, exist_ok=True)
    HASH_FILE.write_text(json.dumps(hashes, indent=2, ensure_ascii=False), encoding="utf-8")


def rodar_scraper(script: str) -> bool:
    """Roda o scraper Python. Retorna True se sucesso."""
    log(f"  Rodando scraper: {script}")
    result = subprocess.run(
        [PYTHON, "-W", "ignore", script],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        cwd=Path(__file__).parent,
    )
    if result.stdout:
        for linha in result.stdout.strip().splitlines():
            log(f"    {linha}")
    if result.returncode != 0:
        log(f"  ERRO no scraper (código {result.returncode})")
        if result.stderr:
            log(f"  {result.stderr[:500]}")
        return False
    return True


def salvar_no_banco(api_id: str, output_file: Path) -> tuple[bool, int]:
    """
    Chama a API Next.js para salvar os dados no banco.
    Retorna (sucesso, total_horarios).
    """
    import urllib.request
    import urllib.error

    dados = json.loads(output_file.read_text(encoding="utf-8"))
    url = f"http://localhost:3000/api/admin/scrape-{api_id}-salvar"

    try:
        body = json.dumps(dados).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            resultado = json.loads(resp.read().decode("utf-8"))
            total = resultado.get("total", 0)
            return True, total
    except urllib.error.URLError as e:
        log(f"  AVISO: API não disponível ({e}). Salvando via script direto...")
        return False, 0


def processar_empresa(scraper: dict, forcar: bool, hashes_anteriores: dict) -> dict:
    """Processa uma empresa: scrape → compara → salva se necessário."""
    log(f"\n{'='*50}")
    log(f"Empresa: {scraper['nome']}")

    output = Path(scraper["output"])

    # 1. Roda o scraper
    ok = rodar_scraper(scraper["script"])
    if not ok:
        return {"id": scraper["id"], "status": "erro_scraper", "total": 0}

    # 2. Calcula hash do novo JSON
    hash_novo = calcular_hash(output)
    hash_anterior = hashes_anteriores.get(scraper["id"])

    if not forcar and hash_novo == hash_anterior:
        log(f"  Sem mudanças detectadas. Banco já está atualizado.")
        return {"id": scraper["id"], "status": "sem_mudancas", "total": 0}

    log(f"  {'Forçando atualização' if forcar else 'Mudanças detectadas'}! Salvando no banco...")

    # 3. Tenta salvar via API (precisa do servidor Next.js rodando)
    # Se falhar, salva direto via Prisma CLI
    try:
        import urllib.request
        dados = json.loads(output.read_text(encoding="utf-8"))
        url = f"http://localhost:3000/api/admin/scrape-{scraper['id']}"
        # Para São Bento o endpoint é diferente — usa o JSON já gerado
        if scraper["id"] == "saobento":
            url = "http://localhost:3000/api/admin/salvar-saobento-json"

        body = json.dumps(dados).encode("utf-8")
        req = urllib.request.Request(
            url, data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            resultado = json.loads(resp.read().decode("utf-8"))
            total = resultado.get("total", 0)
            log(f"  ✅ {total} horários salvos via API")
            return {"id": scraper["id"], "status": "atualizado", "total": total, "hash": hash_novo}

    except Exception as e:
        log(f"  API indisponível: {e}")
        log(f"  JSON salvo em {output} — rode o admin para importar manualmente")
        return {"id": scraper["id"], "status": "json_salvo", "total": 0, "hash": hash_novo}


def main():
    parser = argparse.ArgumentParser(description="Atualiza todos os scrapers do BusOnTime")
    parser.add_argument("--forcar", action="store_true", help="Força atualização mesmo sem diferenças")
    parser.add_argument("--apenas", choices=["saobento", "ribe", "rapidodoeste"],
                        help="Roda apenas uma empresa")
    args = parser.parse_args()

    log(f"\n{'#'*60}")
    log(f"ATUALIZAÇÃO INICIADA {'(FORÇADA)' if args.forcar else ''}")
    log(f"{'#'*60}")

    hashes = carregar_hashes()
    scrapers = [s for s in SCRAPERS if not args.apenas or s["id"] == args.apenas]

    resultados = []
    for scraper in scrapers:
        resultado = processar_empresa(scraper, args.forcar, hashes)
        resultados.append(resultado)
        # Atualiza hash se processou com sucesso
        if "hash" in resultado and resultado["hash"]:
            hashes[resultado["id"]] = resultado["hash"]
            salvar_hashes(hashes)

    # Resumo final
    log(f"\n{'='*50}")
    log("RESUMO:")
    total_geral = 0
    for r in resultados:
        status_emoji = {
            "atualizado": "✅",
            "sem_mudancas": "⏭️",
            "erro_scraper": "❌",
            "json_salvo": "📁",
        }.get(r["status"], "❓")
        log(f"  {status_emoji} {r['id']:15} — {r['status']} ({r['total']} horários)")
        total_geral += r["total"]

    log(f"\nTotal atualizado: {total_geral} horários")
    log(f"Concluído em {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


if __name__ == "__main__":
    main()
