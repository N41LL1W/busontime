# -*- coding: utf-8 -*-
"""
scraper_ribe.py - Coloque na raiz: busontime/scraper_ribe.py
Uso: .venv\\Scripts\\python.exe scraper_ribe.py
"""

import json
import re
import datetime
import unicodedata
from pathlib import Path
import urllib.request

OUTPUT = Path("public/horarios-ribe.json")

ROTAS = [
    {
        "url": "https://www.ribetransporte.com.br/ribeirao-preto-a-jardinopolis/",
        "origem": "Ribeirão Preto",
        "destino": "Jardinópolis",
        "sentido": "ida",
    },
    {
        "url": "https://www.ribetransporte.com.br/linha-01/",
        "origem": "Jardinópolis",
        "destino": "Ribeirão Preto",
        "sentido": "ida",
    },
]

DIAS_MAP = {
    "segunda": "Segunda a Sexta",
    "sexta":   "Segunda a Sexta",
    "sabado":  "Sábado",
    "domingo": "Domingo e Feriados",
    "feriado": "Domingo e Feriados",
}

HORARIO_RE = re.compile(r"^(\d{1,2}:\d{2})\s*(.*)?$")

def norm(texto):
    t = unicodedata.normalize("NFD", texto)
    return "".join(c for c in t if unicodedata.category(c) != "Mn").lower().strip()

def identificar_dia(linha):
    n = norm(linha)
    for chave, valor in DIAS_MAP.items():
        if chave in n:
            return valor
    return None

def html_para_texto(html):
    """Remove tags HTML e decodifica entidades básicas."""
    # Remove scripts e styles completos
    html = re.sub(r"<script[^>]*>.*?</script>", " ", html, flags=re.DOTALL)
    html = re.sub(r"<style[^>]*>.*?</style>", " ", html, flags=re.DOTALL)
    # Substitui tags de bloco por newline
    html = re.sub(r"<(?:br|p|div|h[1-6]|li)[^>]*>", "\n", html, flags=re.IGNORECASE)
    # Remove demais tags
    html = re.sub(r"<[^>]+>", " ", html)
    # Entidades HTML comuns
    entidades = {
        "&amp;": "&", "&lt;": "<", "&gt;": ">", "&nbsp;": " ",
        "&agrave;": "à", "&aacute;": "á", "&acirc;": "â", "&atilde;": "ã",
        "&egrave;": "è", "&eacute;": "é", "&ecirc;": "ê",
        "&igrave;": "ì", "&iacute;": "í",
        "&ograve;": "ò", "&oacute;": "ó", "&ocirc;": "ô", "&otilde;": "õ",
        "&ugrave;": "ù", "&uacute;": "ú", "&ucirc;": "û",
        "&ccedil;": "ç", "&ntilde;": "ñ",
        "&Agrave;": "À", "&Aacute;": "Á", "&Acirc;": "Â", "&Atilde;": "Ã",
        "&Eacute;": "É", "&Oacute;": "Ó", "&Uacute;": "Ú", "&Ccedil;": "Ç",
        "&#8594;": "→", "&#8592;": "←", "&#8660;": "↔",
        "&rarr;": "→", "&larr;": "←",
    }
    for ent, char in entidades.items():
        html = html.replace(ent, char)
    # Remove entidades numéricas restantes
    html = re.sub(r"&#\d+;", "", html)
    html = re.sub(r"&[a-zA-Z]+;", "", html)
    return html

def fetch_html(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read()
        # Tenta detectar encoding pelo header
        content_type = resp.headers.get("Content-Type", "")
        enc_match = re.search(r"charset=([\w-]+)", content_type)
        enc = enc_match.group(1) if enc_match else "utf-8"
        return raw.decode(enc, errors="replace")

def extrair_tarifa(texto):
    # Ex: "Tarifa: R$ 8,25" ou "Tarifa R$ 8,25"
    match = re.search(r"[Tt]arifa[:\s]+R\$\s*([\d,\.]+)", texto)
    if match:
        val = match.group(1).replace(",", ".")
        try:
            return float(val)
        except ValueError:
            pass
    return None

def parse_horarios(html, sentido):
    texto = html_para_texto(html)
    tarifa = extrair_tarifa(texto)
    linhas = [l.strip() for l in texto.splitlines() if l.strip()]

    horarios = []
    dia_atual = "Segunda a Sexta"

    for linha in linhas:
        dia = identificar_dia(linha)
        if dia:
            dia_atual = dia
            continue

        m = HORARIO_RE.match(linha)
        if m:
            h = m.group(1).zfill(5)
            obs = m.group(2).strip() if m.group(2) else None
            # Ignora linhas que são claramente menu/nav (muito longas ou sem horário real)
            if obs and len(obs) > 80:
                continue
            horarios.append({
                "horario": h,
                "diaDaSemana": dia_atual,
                "sentido": sentido,
                "tipo": "rodoviaria",
                "observacao": obs or None,
            })

    return horarios, tarifa

def scrape_rota(rota):
    print(f"  Buscando: {rota['origem']} → {rota['destino']}")
    html = fetch_html(rota["url"])
    horarios, tarifa = parse_horarios(html, rota["sentido"])
    print(f"  {len(horarios)} horários | tarifa: R$ {tarifa}")
    return {
        "url": rota["url"],
        "origem": rota["origem"],
        "destino": rota["destino"],
        "sentido": rota["sentido"],
        "tarifa": tarifa,
        "horarios": horarios,
    }

def main():
    print("Ribe Transporte — raspagem iniciada...")
    resultados = []
    for rota in ROTAS:
        try:
            resultados.append(scrape_rota(rota))
        except Exception as e:
            print(f"  ERRO: {e}")

    saida = {
        "empresa": "Ribe Transporte",
        "linha": "Ribeirão Preto ↔ Jardinópolis",
        "sourceUrl": "https://www.ribetransporte.com.br",
        "rotas": resultados,
        "pesquisado_em": datetime.datetime.now().isoformat(),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, indent=2)

    total = sum(len(r["horarios"]) for r in resultados)
    print(f"\nConcluído! {total} horários em {OUTPUT}")

if __name__ == "__main__":
    main()
