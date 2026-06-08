# -*- coding: utf-8 -*-
"""
scraper_rapidodoeste.py - Coloque na raiz: busontime/scraper_rapidodoeste.py
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

LINHAS = [
    {"codigo": "0083",   "url": "https://suburbano.rapidodoeste.com.br/linha-0083/",        "origem": "Pontal",                  "destino": "Ribeirão Preto"},
    {"codigo": "0084",   "url": "https://suburbano.rapidodoeste.com.br/linha-0084/",        "origem": "Cruz das Posses",          "destino": "Ribeirão Preto"},
    {"codigo": "0085",   "url": "https://suburbano.rapidodoeste.com.br/linha-0085/",        "origem": "Viradouro",                "destino": "Ribeirão Preto"},
    {"codigo": "0086",   "url": "https://suburbano.rapidodoeste.com.br/linha-0086/",        "origem": "Terra Roxa",               "destino": "Bebedouro"},
    {"codigo": "0086-2", "url": "https://suburbano.rapidodoeste.com.br/0086-2-candia-x-pontal/", "origem": "Cândia",             "destino": "Pontal"},
    {"codigo": "6228",   "url": "https://suburbano.rapidodoeste.com.br/6228-morro-agudo-x-ribeirao-preto/", "origem": "Morro Agudo", "destino": "Ribeirão Preto"},
    {"codigo": "6309",   "url": "https://suburbano.rapidodoeste.com.br/6309-santa-rosa-de-viterbo-x-ribeirao-preto/", "origem": "Santa Rosa de Viterbo", "destino": "Ribeirão Preto"},
    {"codigo": "6310",   "url": "https://suburbano.rapidodoeste.com.br/6310-rincao-x-ribeirao-preto/", "origem": "Rincão",       "destino": "Ribeirão Preto"},
    {"codigo": "6312",   "url": "https://suburbano.rapidodoeste.com.br/linha-6312/",        "origem": "Taquaritinga",             "destino": "Ribeirão Preto"},
    {"codigo": "6313",   "url": "https://suburbano.rapidodoeste.com.br/linha-6313/",        "origem": "Jaboticabal",              "destino": "Ribeirão Preto"},
    {"codigo": "6322",   "url": "https://suburbano.rapidodoeste.com.br/6322-luiz-antonio-x-ribeirao-preto/", "origem": "Luiz Antônio", "destino": "Ribeirão Preto"},
    {"codigo": "6429",   "url": "https://suburbano.rapidodoeste.com.br/linha-57/",          "origem": "Jaborandi",                "destino": "Barretos"},
    {"codigo": "7783",   "url": "https://suburbano.rapidodoeste.com.br/linha-7783/",        "origem": "Matão",                    "destino": "Ribeirão Preto"},
    {"codigo": "8372",   "url": "https://suburbano.rapidodoeste.com.br/linha-5220/",        "origem": "São Simão",                "destino": "Ribeirão Preto"},
    {"codigo": "8374",   "url": "https://suburbano.rapidodoeste.com.br/linha-8374/",        "origem": "Cravinhos",                "destino": "Ribeirão Preto"},
    {"codigo": "8764",   "url": "https://suburbano.rapidodoeste.com.br/8764-tambau-x-ribeirao-preto/", "origem": "Tambaú",       "destino": "Ribeirão Preto"},
    {"codigo": "9015",   "url": "https://suburbano.rapidodoeste.com.br/linha-9015/",        "origem": "Pitangueiras",             "destino": "Ribeirão Preto"},
]

DIAS_MAP = {
    "segunda": "Segunda a Sexta",
    "sexta":   "Segunda a Sexta",
    "util":    "Segunda a Sexta",
    "sabado":  "Sábado",
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
    result = re.sub(r"\s+", " ", result)
    return result.strip()

def extrair_tarifa(html):
    # Captura "Tarifa:** R$ 8,25" ou "Tarifa: R$ 8,25"
    m = re.search(r"Tarifa[^R]{0,10}R\$\s*([\d,\.]+)", html)
    if m:
        try:
            return float(m.group(1).replace(",", "."))
        except ValueError:
            pass
    return None

def extrair_linha_nome(html):
    m = re.search(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL)
    if m:
        return strip_tags(m.group(1)).strip()
    return ""

def parse_horario(texto):
    t = texto.strip().rstrip("*").strip()
    m = re.match(r"^(\d{1,2}:\d{2})$", t)
    if m:
        h = m.group(1).zfill(5)
        return h
    return None

def extrair_tabelas(html):
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

def parse_linha(html, origem, destino, codigo):
    tarifa = extrair_tarifa(html)
    nome_linha = extrair_linha_nome(html)

    horarios_por_dia_ida = {}
    horarios_por_dia_volta = {}

    # Divide o HTML por seções de dia (h2 ou h3)
    partes = re.split(r"(<h[23][^>]*>)", html, flags=re.IGNORECASE)

    dia_atual = "Segunda a Sexta"

    for i, parte in enumerate(partes):
        # Detecta tag de título
        if re.match(r"<h[23]", parte, re.IGNORECASE):
            continue

        # Texto do título anterior
        texto_titulo = strip_tags(partes[i-1]) if i > 0 else ""
        dia = identificar_dia(texto_titulo) or identificar_dia(parte[:300])
        if dia:
            dia_atual = dia

        tabelas = extrair_tabelas(parte)
        for tabela in tabelas:
            if len(tabela) < 2:
                continue

            # Verifica se é tabela de horários
            cabecalho = " ".join(tabela[0]).lower()
            if "parte de" not in cabecalho:
                continue

            for row in tabela[1:]:
                if len(row) < 1:
                    continue

                # Ida: coluna 0
                h_ida = parse_horario(row[0]) if len(row) > 0 else None
                via_ida = row[1].strip() if len(row) > 1 else ""
                obs_ida = row[2].strip() if len(row) > 2 else ""

                # Volta: coluna 3
                h_volta = parse_horario(row[3]) if len(row) > 3 else None
                via_volta = row[4].strip() if len(row) > 4 else ""
                obs_volta = row[5].strip() if len(row) > 5 else ""

                if h_ida:
                    obs = " | ".join(filter(None, [f"Via {via_ida}" if via_ida else "", obs_ida]))
                    if dia_atual not in horarios_por_dia_ida:
                        horarios_por_dia_ida[dia_atual] = []
                    horarios_por_dia_ida[dia_atual].append({
                        "horario": h_ida,
                        "diaDaSemana": dia_atual,
                        "sentido": "ida",
                        "tipo": "rodoviaria",
                        "observacao": obs or None,
                    })

                if h_volta:
                    obs = " | ".join(filter(None, [f"Via {via_volta}" if via_volta else "", obs_volta]))
                    if dia_atual not in horarios_por_dia_volta:
                        horarios_por_dia_volta[dia_atual] = []
                    horarios_por_dia_volta[dia_atual].append({
                        "horario": h_volta,
                        "diaDaSemana": dia_atual,
                        "sentido": "ida",
                        "tipo": "rodoviaria",
                        "observacao": obs or None,
                    })

    # Achata tudo
    h_ida_flat = [h for lista in horarios_por_dia_ida.values() for h in lista]
    h_volta_flat = [h for lista in horarios_por_dia_volta.values() for h in lista]

    return {
        "codigo": codigo,
        "nome": nome_linha,
        "tarifa": tarifa,
        "rotas": [
            {"origem": origem, "destino": destino, "sentido": "ida", "tarifa": tarifa, "horarios": h_ida_flat},
            {"origem": destino, "destino": origem, "sentido": "ida", "tarifa": tarifa, "horarios": h_volta_flat},
        ],
    }

def main():
    print("Rápido d'Oeste — raspagem iniciada...")
    print(f"Total de linhas: {len(LINHAS)}\n")

    resultados = []
    total_geral = 0

    for i, linha in enumerate(LINHAS, 1):
        print(f"[{i:2}/{len(LINHAS)}] {linha['codigo']} {linha['origem']} x {linha['destino']}")
        try:
            html = fetch_html(linha["url"])
            dados = parse_linha(html, linha["origem"], linha["destino"], linha["codigo"])
            total_h = sum(len(r["horarios"]) for r in dados["rotas"])
            print(f"        {total_h} horários | tarifa: R$ {dados['tarifa']}")
            resultados.append(dados)
            total_geral += total_h
        except Exception as e:
            print(f"        ERRO: {e}")
            resultados.append({"codigo": linha["codigo"], "nome": "", "tarifa": None, "rotas": [], "erro": str(e)})

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
