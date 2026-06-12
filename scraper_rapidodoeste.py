# -*- coding: utf-8 -*-
"""
scraper_rapidodoeste.py
Uso: .venv\\Scripts\\python.exe scraper_rapidodoeste.py
Salva em: public/horarios-rapidodoeste.json
"""

import json
import re
import datetime
import unicodedata
from pathlib import Path
import urllib.request

OUTPUT = Path("public/horarios-rapidodoeste.json")

LINHAS_PADRAO = [
    {"codigo": "0083",   "url": "https://suburbano.rapidodoeste.com.br/linha-0083/",        "origem": "Pontal",               "destino": "Ribeirão Preto"},
    {"codigo": "0084",   "url": "https://suburbano.rapidodoeste.com.br/linha-0084/",        "origem": "Cruz das Posses",       "destino": "Ribeirão Preto"},
    {"codigo": "0085",   "url": "https://suburbano.rapidodoeste.com.br/linha-0085/",        "origem": "Viradouro",             "destino": "Ribeirão Preto"},
    {"codigo": "0086",   "url": "https://suburbano.rapidodoeste.com.br/linha-0086/",        "origem": "Terra Roxa",            "destino": "Bebedouro"},
    {"codigo": "0086-2", "url": "https://suburbano.rapidodoeste.com.br/0086-2-candia-x-pontal/", "origem": "Cândia",          "destino": "Pontal"},
    {"codigo": "6228",   "url": "https://suburbano.rapidodoeste.com.br/6228-morro-agudo-x-ribeirao-preto/", "origem": "Morro Agudo", "destino": "Ribeirão Preto"},
    {"codigo": "6310",   "url": "https://suburbano.rapidodoeste.com.br/6310-rincao-x-ribeirao-preto/", "origem": "Rincão",    "destino": "Ribeirão Preto"},
    {"codigo": "6312",   "url": "https://suburbano.rapidodoeste.com.br/linha-6312/",        "origem": "Taquaritinga",          "destino": "Ribeirão Preto"},
    {"codigo": "6313",   "url": "https://suburbano.rapidodoeste.com.br/linha-6313/",        "origem": "Jaboticabal",           "destino": "Ribeirão Preto"},
    {"codigo": "6322",   "url": "https://suburbano.rapidodoeste.com.br/6322-luiz-antonio-x-ribeirao-preto/", "origem": "Luiz Antônio", "destino": "Ribeirão Preto"},
    {"codigo": "6429",   "url": "https://suburbano.rapidodoeste.com.br/linha-57/",          "origem": "Jaborandi",             "destino": "Barretos"},
    {"codigo": "7783",   "url": "https://suburbano.rapidodoeste.com.br/linha-7783/",        "origem": "Matão",                 "destino": "Ribeirão Preto"},
    {"codigo": "8372",   "url": "https://suburbano.rapidodoeste.com.br/linha-5220/",        "origem": "São Simão",             "destino": "Ribeirão Preto"},
    {"codigo": "8374",   "url": "https://suburbano.rapidodoeste.com.br/linha-8374/",        "origem": "Cravinhos",             "destino": "Ribeirão Preto"},
    {"codigo": "8764",   "url": "https://suburbano.rapidodoeste.com.br/8764-tambau-x-ribeirao-preto/", "origem": "Tambaú",    "destino": "Ribeirão Preto"},
    {"codigo": "9015",   "url": "https://suburbano.rapidodoeste.com.br/linha-9015/",        "origem": "Pitangueiras",          "destino": "Ribeirão Preto"},
]

# Linha 6309: tabela multi-coluna com várias cidades e tarifas diferentes por trecho
LINHA_6309 = {
    "codigo": "6309",
    "url": "https://suburbano.rapidodoeste.com.br/6309-santa-rosa-de-viterbo-x-ribeirao-preto/",
    "pares": [
        {"origem": "Santa Rosa de Viterbo", "destino": "Ribeirão Preto", "col_ida": 0, "col_volta": 6},
        {"origem": "Cravinhos",             "destino": "Ribeirão Preto", "col_ida": 1, "col_volta": 5},
        {"origem": "São Simão",             "destino": "Ribeirão Preto", "col_ida": 2, "col_volta": 4},
    ],
    "tarifas": {
        "Santa Rosa de Viterbo": 22.20,
        "Cravinhos": 8.25,
        "São Simão": 16.55,
    }
}

DIAS_MAP = {
    "segunda": "Segunda a Sexta",
    "sexta":   "Segunda a Sexta",
    "util":    "Segunda a Sexta",
    "útil":    "Segunda a Sexta",
    "sabado":  "Sábado",
    "sábado":  "Sábado",
    "domingo": "Domingo e Feriados",
    "feriado": "Domingo e Feriados",
}

def norm(texto):
    t = unicodedata.normalize("NFD", str(texto))
    return "".join(c for c in t if unicodedata.category(c) != "Mn").lower().strip()

def identificar_dia(texto):
    n = norm(texto)
    for chave, valor in DIAS_MAP.items():
        if chave in n:
            return valor
    return None

def fetch_html(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        raw = resp.read()
        ct = resp.headers.get("Content-Type", "")
        m = re.search(r"charset=([\w-]+)", ct)
        enc = m.group(1) if m else "utf-8"
        return raw.decode(enc, errors="replace")

def strip_tags(html):
    result = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", result).strip()

def extrair_tarifa(html):
    # Tenta vários padrões: "Tarifa:** R$ 8,25", "Tarifa: R$ 8,25"
    m = re.search(r"Tarifa[^R\n]{0,20}R\$\s*([\d,\.]+)", html)
    if m:
        try:
            f = float(m.group(1).replace(",", "."))
            if 1 < f < 100:
                return f
        except ValueError:
            pass
    return None

def extrair_linha_nome(html):
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL)
    return strip_tags(m.group(1)).strip() if m else ""

def parse_horario(texto):
    t = re.sub(r"[*\s]", "", str(texto))
    m = re.match(r"^(\d{1,2}:\d{2})$", t)
    return m.group(1).zfill(5) if m else None

def extrair_tabelas_raw(html):
    tabelas = []
    for tabela_html in re.finditer(r"<table[^>]*>(.*?)</table>", html, re.DOTALL | re.IGNORECASE):
        tabela = []
        for tr in re.finditer(r"<tr[^>]*>(.*?)</tr>", tabela_html.group(1), re.DOTALL | re.IGNORECASE):
            linha = []
            for td in re.finditer(r"<t[dh][^>]*>(.*?)</t[dh]>", tr.group(1), re.DOTALL | re.IGNORECASE):
                linha.append(strip_tags(td.group(1)).strip())
            if linha:
                tabela.append(linha)
        if tabela:
            tabelas.append(tabela)
    return tabelas

def parse_linha_padrao(html, origem, destino, codigo):
    tarifa = extrair_tarifa(html)
    nome = extrair_linha_nome(html)
    horarios_ida = {}
    horarios_volta = {}
    dia_atual = "Segunda a Sexta"

    partes = re.split(r"<h[23][^>]*>(.*?)</h[23]>", html, flags=re.DOTALL | re.IGNORECASE)

    for i, parte in enumerate(partes):
        if i % 2 == 1:
            dia = identificar_dia(strip_tags(parte))
            if dia:
                dia_atual = dia
            continue

        for tabela in extrair_tabelas_raw(parte):
            if len(tabela) < 2:
                continue
            if "parte de" not in " ".join(tabela[0]).lower():
                continue

            for row in tabela[1:]:
                h_ida = parse_horario(row[0]) if len(row) > 0 else None
                via_ida = row[1].strip() if len(row) > 1 else ""
                obs_ida = row[2].strip() if len(row) > 2 else ""
                h_volta = parse_horario(row[3]) if len(row) > 3 else None
                via_volta = row[4].strip() if len(row) > 4 else ""
                obs_volta = row[5].strip() if len(row) > 5 else ""

                if h_ida:
                    obs = " | ".join(filter(None, [f"Via {via_ida}" if via_ida else "", obs_ida]))
                    horarios_ida.setdefault(dia_atual, []).append({
                        "horario": h_ida, "diaDaSemana": dia_atual,
                        "sentido": "ida", "tipo": "rodoviaria", "observacao": obs or None,
                    })
                if h_volta:
                    obs = " | ".join(filter(None, [f"Via {via_volta}" if via_volta else "", obs_volta]))
                    horarios_volta.setdefault(dia_atual, []).append({
                        "horario": h_volta, "diaDaSemana": dia_atual,
                        "sentido": "ida", "tipo": "rodoviaria", "observacao": obs or None,
                    })

    return {
        "codigo": codigo, "nome": nome, "tarifa": tarifa,
        "rotas": [
            {"origem": origem, "destino": destino, "tarifa": tarifa,
             "horarios": [h for l in horarios_ida.values() for h in l]},
            {"origem": destino, "destino": origem, "tarifa": tarifa,
             "horarios": [h for l in horarios_volta.values() for h in l]},
        ],
    }

def parse_linha_6309(html, config):
    nome = extrair_linha_nome(html)
    dia_atual = "Segunda a Sexta"
    rotas_h = {i: {"ida": {}, "volta": {}} for i in range(len(config["pares"]))}

    partes = re.split(r"<h[23][^>]*>(.*?)</h[23]>", html, flags=re.DOTALL | re.IGNORECASE)

    for i, parte in enumerate(partes):
        if i % 2 == 1:
            dia = identificar_dia(strip_tags(parte))
            if dia:
                dia_atual = dia
            continue

        for tabela in extrair_tabelas_raw(parte):
            if len(tabela) < 2 or len(tabela[0]) < 4:
                continue
            # Verifica se tem horários
            if not any(parse_horario(c) for row in tabela[1:3] for c in row):
                continue

            for row in tabela[1:]:
                for pi, par in enumerate(config["pares"]):
                    ci = par["col_ida"]
                    cv = par["col_volta"]
                    h_i = parse_horario(row[ci]) if ci < len(row) else None
                    h_v = parse_horario(row[cv]) if cv < len(row) else None
                    if h_i:
                        rotas_h[pi]["ida"].setdefault(dia_atual, []).append({
                            "horario": h_i, "diaDaSemana": dia_atual,
                            "sentido": "ida", "tipo": "rodoviaria", "observacao": None,
                        })
                    if h_v:
                        rotas_h[pi]["volta"].setdefault(dia_atual, []).append({
                            "horario": h_v, "diaDaSemana": dia_atual,
                            "sentido": "ida", "tipo": "rodoviaria", "observacao": None,
                        })

    rotas = []
    for pi, par in enumerate(config["pares"]):
        tarifa = config["tarifas"].get(par["origem"])
        h_ida = [h for l in rotas_h[pi]["ida"].values() for h in l]
        h_volta = [h for l in rotas_h[pi]["volta"].values() for h in l]
        if h_ida:
            rotas.append({"origem": par["origem"], "destino": par["destino"], "tarifa": tarifa, "horarios": h_ida})
        if h_volta:
            rotas.append({"origem": par["destino"], "destino": par["origem"], "tarifa": tarifa, "horarios": h_volta})

    return {"codigo": config["codigo"], "nome": nome, "tarifa": None, "rotas": rotas}

def main():
    total_linhas = len(LINHAS_PADRAO) + 1
    print(f"Rápido d'Oeste — {total_linhas} linhas\n")

    resultados = []
    total_geral = 0

    for i, linha in enumerate(LINHAS_PADRAO, 1):
        print(f"[{i:2}/{total_linhas}] {linha['codigo']} {linha['origem']} x {linha['destino']}")
        try:
            html = fetch_html(linha["url"])
            dados = parse_linha_padrao(html, linha["origem"], linha["destino"], linha["codigo"])
            total_h = sum(len(r["horarios"]) for r in dados["rotas"])
            print(f"        {total_h} horários | tarifa: R$ {dados['tarifa']}")
            resultados.append(dados)
            total_geral += total_h
        except Exception as e:
            print(f"        ERRO: {e}")
            resultados.append({"codigo": linha["codigo"], "nome": "", "tarifa": None, "rotas": [], "erro": str(e)})

    print(f"[{total_linhas:2}/{total_linhas}] 6309 Santa Rosa de Viterbo (multi-ponto)")
    try:
        html = fetch_html(LINHA_6309["url"])
        dados = parse_linha_6309(html, LINHA_6309)
        total_h = sum(len(r["horarios"]) for r in dados["rotas"])
        print(f"        {total_h} horários | {len(dados['rotas'])} rotas")
        resultados.append(dados)
        total_geral += total_h
    except Exception as e:
        print(f"        ERRO: {e}")
        resultados.append({"codigo": "6309", "nome": "", "tarifa": None, "rotas": [], "erro": str(e)})

    saida = {
        "empresa": "Rápido d'Oeste",
        "slug": "rapidodoeste",
        "sourceUrl": "https://suburbano.rapidodoeste.com.br",
        "linhas": resultados,
        "pesquisado_em": datetime.datetime.now().isoformat(),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(saida, f, ensure_ascii=False, indent=2)

    print(f"\nConcluído! {total_geral} horários salvos em {OUTPUT}")

if __name__ == "__main__":
    main()