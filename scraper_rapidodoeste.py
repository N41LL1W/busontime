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
import itertools
from pathlib import Path
import urllib.request

OUTPUT = Path("public/horarios-rapidodoeste.json")

# Linhas com formato padrão simples (ida/volta lado a lado, 2/4/6 colunas)
LINHAS_PADRAO = [
    {"codigo": "0083",   "url": "https://suburbano.rapidodoeste.com.br/linha-0083/",        "origem": "Pontal",               "destino": "Ribeirão Preto",  "tarifa_fallback": 9.25},
    {"codigo": "0084",   "url": "https://suburbano.rapidodoeste.com.br/linha-0084/",        "origem": "Cruz das Posses",       "destino": "Ribeirão Preto",  "tarifa_fallback": 9.00},
    {"codigo": "0086",   "url": "https://suburbano.rapidodoeste.com.br/linha-0086/",        "origem": "Terra Roxa",            "destino": "Bebedouro",       "tarifa_fallback": 10.75},
    {"codigo": "0086-2", "url": "https://suburbano.rapidodoeste.com.br/0086-2-candia-x-pontal/", "origem": "Cândia",          "destino": "Pontal",          "tarifa_fallback": 9.25},
    {"codigo": "6228",   "url": "https://suburbano.rapidodoeste.com.br/6228-morro-agudo-x-ribeirao-preto/", "origem": "Morro Agudo", "destino": "Ribeirão Preto", "tarifa_fallback": 22.15},
    {"codigo": "6310",   "url": "https://suburbano.rapidodoeste.com.br/6310-rincao-x-ribeirao-preto/", "origem": "Rincão",    "destino": "Ribeirão Preto",  "tarifa_fallback": None},
    {"codigo": "6312",   "url": "https://suburbano.rapidodoeste.com.br/linha-6312/",        "origem": "Taquaritinga",          "destino": "Ribeirão Preto",  "tarifa_fallback": 26.65},
    {"codigo": "6313",   "url": "https://suburbano.rapidodoeste.com.br/linha-6313/",        "origem": "Jaboticabal",           "destino": "Ribeirão Preto",  "tarifa_fallback": 18.25},
    {"codigo": "6322",   "url": "https://suburbano.rapidodoeste.com.br/6322-luiz-antonio-x-ribeirao-preto/", "origem": "Luiz Antônio", "destino": "Ribeirão Preto", "tarifa_fallback": 16.75},
    {"codigo": "6429",   "url": "https://suburbano.rapidodoeste.com.br/linha-57/",          "origem": "Jaborandi",             "destino": "Barretos",        "tarifa_fallback": None},
    {"codigo": "7783",   "url": "https://suburbano.rapidodoeste.com.br/linha-7783/",        "origem": "Matão",                 "destino": "Ribeirão Preto",  "tarifa_fallback": 34.70},
    {"codigo": "8372",   "url": "https://suburbano.rapidodoeste.com.br/linha-5220/",        "origem": "São Simão",             "destino": "Ribeirão Preto",  "tarifa_fallback": 17.20},
    {"codigo": "8374",   "url": "https://suburbano.rapidodoeste.com.br/linha-8374/",        "origem": "Cravinhos",             "destino": "Ribeirão Preto",  "tarifa_fallback": 8.65},
    {"codigo": "8764",   "url": "https://suburbano.rapidodoeste.com.br/8764-tambau-x-ribeirao-preto/", "origem": "Tambaú",    "destino": "Ribeirão Preto",  "tarifa_fallback": 31.70},
    {"codigo": "9015",   "url": "https://suburbano.rapidodoeste.com.br/linha-9015/",        "origem": "Pitangueiras",          "destino": "Ribeirão Preto",  "tarifa_fallback": 21.15},
]

# Linha 6309: mantém parser DEDICADO (7 colunas: Santa Rosa, São Simão, Bento Quirino,
# Outlet, Shopping Iguatemi, Ribeirão Shopping, Ribeirão Preto — não é uma cadeia simétrica
# de 4 pontos como a 0085, então usa mapeamento de coluna explícito por par)
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

LINHA_0085 = {
    "codigo": "0085",
    "url": "https://suburbano.rapidodoeste.com.br/linha-0085/",
    "pontos_ida": ["Viradouro", "Pitangueiras", "Sertãozinho", "Ribeirão Preto"],
}

DIAS_MAP = {
    "segunda": "Segunda a Sexta",
    "sexta":   "Segunda a Sexta",
    "util":    "Segunda a Sexta",
    "utel":    "Segunda a Sexta",
    "sabado":  "Sábado",
    "domingo": "Domingo e Feriados",
    "feriado": "Domingo e Feriados",
}

# Regex do cabeçalho de sentido dentro da tabela: aceita "Parte de X" e "Partindo de X" e "Chega em X"
RE_CABECALHO_SENTIDO = re.compile(r"part(e|indo)\s+de|chega\s+em", re.IGNORECASE)

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
    # Uma única tarifa: "Tarifa: R$ 8,25" ou "Tarifa:** R$8,25"
    m = re.search(r"Tarifa[^R\n:]{0,20}:?\s*(?:R\$\s*)+([\d,\.]+)", html)
    if m:
        try:
            f = float(m.group(1).replace(",", "."))
            if 1 < f < 100:
                return f
        except ValueError:
            pass
    return None

def extrair_multiplas_tarifas(html):
    """Extrai tarifas do tipo 'Tarifa X à Y: R$Z' — retorna dict {frozenset({x,y}): valor}"""
    tarifas = {}
    for m in re.finditer(r"Tarifa\s+([A-Za-zÀ-ÿ .]+?)\s+(?:à|a|ao)\s+([A-Za-zÀ-ÿ .]+?)\s*:\s*(?:R\$\s*)+([\d,\.]+)", html):
        cidade1 = m.group(1).strip()
        cidade2 = m.group(2).strip()
        try:
            valor = float(m.group(3).replace(",", "."))
        except ValueError:
            continue
        tarifas[frozenset([norm(cidade1), norm(cidade2)])] = valor
    return tarifas

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

# ── Parser genérico: ida/volta lado a lado, quantidade de colunas variável ──────
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
            if not RE_CABECALHO_SENTIDO.search(tabela[0][0] if tabela[0] else ""):
                continue

            for row in tabela[1:]:
                # Linha de "não há programação" ou header repetido no meio da tabela — pula
                if len(row) < 2:
                    continue

                meia = len(row) // 2
                if meia < 1:
                    continue
                ida_cols = row[:meia]
                volta_cols = row[meia:]

                h_ida = parse_horario(ida_cols[0]) if ida_cols else None
                via_ida = " ".join(ida_cols[1:]).strip() if len(ida_cols) > 1 else ""

                h_volta = parse_horario(volta_cols[0]) if volta_cols else None
                via_volta = " ".join(volta_cols[1:]).strip() if len(volta_cols) > 1 else ""

                if h_ida:
                    obs = f"Via {via_ida}" if via_ida else None
                    horarios_ida.setdefault(dia_atual, []).append({
                        "horario": h_ida, "diaDaSemana": dia_atual,
                        "sentido": "ida", "tipo": "rodoviaria", "observacao": obs,
                    })
                if h_volta:
                    obs = f"Via {via_volta}" if via_volta else None
                    horarios_volta.setdefault(dia_atual, []).append({
                        "horario": h_volta, "diaDaSemana": dia_atual,
                        "sentido": "ida", "tipo": "rodoviaria", "observacao": obs,
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

# ── Parser multi-ponto genérico: colunas = cidades em cadeia, com header embutido no meio ──
def parse_linha_multiponto(html, config):
    nome = extrair_linha_nome(html)
    tarifas_dict = extrair_multiplas_tarifas(html)
    if not tarifas_dict:
        # fallback: tarifa única aplicada a todos os pares
        t = extrair_tarifa(html)
        if t:
            pontos = config["pontos_ida"]
            for a, b in itertools.combinations(pontos, 2):
                tarifas_dict[frozenset([norm(a), norm(b)])] = t
    else:
        # combina com tarifas hardcoded se existirem (config pode ter "tarifas" fixas)
        for k, v in config.get("tarifas", {}).items():
            tarifas_dict.setdefault(k, v)

    pontos_ida = config["pontos_ida"]
    pontos_volta = list(reversed(pontos_ida))

    dia_atual = "Segunda a Sexta"
    ordem_atual = pontos_ida
    rotas_horarios: dict = {}  # (origem, destino) -> lista de horarios

    partes = re.split(r"<h[23][^>]*>(.*?)</h[23]>", html, flags=re.DOTALL | re.IGNORECASE)

    for i, parte in enumerate(partes):
        if i % 2 == 1:
            dia = identificar_dia(strip_tags(parte))
            if dia:
                dia_atual = dia
                ordem_atual = pontos_ida  # reseta ordem a cada novo dia
            continue

        for tabela in extrair_tabelas_raw(parte):
            if len(tabela) < 2:
                continue
            if not RE_CABECALHO_SENTIDO.search(tabela[0][0] if tabela[0] else ""):
                continue

            ordem_atual = pontos_ida  # cabeçalho real da tabela = sempre ida

            for row in tabela[1:]:
                # Detecta cabeçalho embutido no meio da tabela (linha "Parte de R.Preto..." sem ser header real)
                primeira_celula = row[0] if row else ""
                if not parse_horario(primeira_celula) and RE_CABECALHO_SENTIDO.search(primeira_celula):
                    ordem_atual = pontos_volta
                    continue

                if len(row) < len(pontos_ida):
                    continue

                tempos = [parse_horario(c) for c in row[:len(pontos_ida)]]

                for idx_a, idx_b in itertools.combinations(range(len(ordem_atual)), 2):
                    if idx_a >= len(tempos) or idx_b >= len(tempos):
                        continue
                    t_a = tempos[idx_a]
                    if not t_a:
                        continue
                    origem = ordem_atual[idx_a]
                    destino = ordem_atual[idx_b]
                    chave = (origem, destino)
                    rotas_horarios.setdefault(chave, []).append({
                        "horario": t_a, "diaDaSemana": dia_atual,
                        "sentido": "ida", "tipo": "rodoviaria", "observacao": None,
                    })

    rotas = []
    for (origem, destino), horarios in rotas_horarios.items():
        tarifa = tarifas_dict.get(frozenset([norm(origem), norm(destino)]))
        # Remove duplicatas mantendo ordem
        vistos = set()
        unicos = []
        for h in horarios:
            k = (h["horario"], h["diaDaSemana"])
            if k not in vistos:
                vistos.add(k)
                unicos.append(h)
        if unicos:
            rotas.append({"origem": origem, "destino": destino, "tarifa": tarifa, "horarios": unicos})

    return {"codigo": config["codigo"], "nome": nome, "tarifa": None, "rotas": rotas}

# ── Parser DEDICADO pra 6309 (7 colunas com mapeamento explícito por par) ──────
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
                            "sentido": "volta", "tipo": "rodoviaria", "observacao": None,
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
    total_linhas = len(LINHAS_PADRAO) + 2
    print(f"Rápido d'Oeste — {total_linhas} linhas\n")

    resultados = []
    total_geral = 0

    for i, linha in enumerate(LINHAS_PADRAO, 1):
        print(f"[{i:2}/{total_linhas}] {linha['codigo']} {linha['origem']} x {linha['destino']}")
        try:
            html = fetch_html(linha["url"])
            dados = parse_linha_padrao(html, linha["origem"], linha["destino"], linha["codigo"])
            if dados["tarifa"] is None and linha.get("tarifa_fallback"):
                dados["tarifa"] = linha["tarifa_fallback"]
                for r in dados["rotas"]:
                    if r["tarifa"] is None:
                        r["tarifa"] = linha["tarifa_fallback"]
            total_h = sum(len(r["horarios"]) for r in dados["rotas"])
            print(f"        {total_h} horários | tarifa: R$ {dados['tarifa']}")
            resultados.append(dados)
            total_geral += total_h
        except Exception as e:
            print(f"        ERRO: {e}")
            resultados.append({"codigo": linha["codigo"], "nome": "", "tarifa": None, "rotas": [], "erro": str(e)})

    # Linhas multi-ponto (cada uma com seu parser específico)
    configs_multiponto = [
        (LINHA_0085, parse_linha_multiponto),
        (LINHA_6309, parse_linha_6309),
    ]
    for idx, (config, parser_fn) in enumerate(configs_multiponto, start=len(LINHAS_PADRAO) + 1):
        print(f"[{idx:2}/{total_linhas}] {config['codigo']} (multi-ponto)")
        try:
            html = fetch_html(config["url"])
            dados = parser_fn(html, config)
            total_h = sum(len(r["horarios"]) for r in dados["rotas"])
            print(f"        {total_h} horários | {len(dados['rotas'])} rotas")
            resultados.append(dados)
            total_geral += total_h
        except Exception as e:
            print(f"        ERRO: {e}")
            resultados.append({"codigo": config["codigo"], "nome": "", "tarifa": None, "rotas": [], "erro": str(e)})

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