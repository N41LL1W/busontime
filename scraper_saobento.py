# -*- coding: utf-8 -*-
"""
scraper_saobento.py - Coloque na raiz: busontime/scraper_saobento.py

Uso:
  .venv\Scripts\python.exe scraper_saobento.py
  .venv\Scripts\python.exe scraper_saobento.py --origem "Brodowski" --destino "Ribeirão Preto"

Salva em: public/horarios-saobento.json
"""

import json
import re
import sys
import argparse
import unicodedata
import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

URL = "https://semiurbano.lovable.app/horarios"
OUTPUT = Path("public/horarios-saobento.json")


def normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFD", texto)
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return texto.lower().strip()


def identificar_dia(texto: str) -> str:
    n = normalizar(texto)
    if "sabado" in n:
        return "Sábado"
    if "domingo" in n or "feriado" in n:
        return "Domingo e Feriados"
    if "segunda" in n or "sexta" in n or "uteis" in n or "util" in n:
        return "Segunda a Sexta"
    return texto.strip()


def fechar_popup(page):
    """Fecha qualquer dialog/popup que esteja na tela."""
    try:
        dialog = page.locator('[role="dialog"]')
        if dialog.count() > 0 and dialog.first.is_visible():
            # Tenta ESC
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            # Se ainda estiver, clica fora
            if dialog.first.is_visible():
                page.mouse.click(10, 10)
                page.wait_for_timeout(500)
    except Exception:
        pass


def listar_cidades(page) -> list:
    btn = page.get_by_role("button", name="Selecionar origem")
    btn.click()
    page.wait_for_timeout(600)

    opcoes = page.locator('[role="option"]')
    cidades = []
    for i in range(opcoes.count()):
        texto = opcoes.nth(i).inner_text().strip()
        if texto:
            cidades.append(texto)

    page.keyboard.press("Escape")
    page.wait_for_timeout(300)
    return cidades


def selecionar_cidade(page, aria_label: str, cidade: str) -> bool:
    print(f"  Selecionando {aria_label}: {cidade}")
    btn = page.get_by_role("button", name=aria_label)
    btn.click()
    page.wait_for_timeout(600)

    cidade_norm = normalizar(cidade)
    opcoes = page.locator('[role="option"]')

    for i in range(opcoes.count()):
        opcao = opcoes.nth(i)
        texto = normalizar(opcao.inner_text())
        if cidade_norm in texto:
            opcao.click()
            page.wait_for_timeout(600)
            return True

    print(f"  AVISO: '{cidade}' nao encontrada")
    page.keyboard.press("Escape")
    return False


def extrair_sentidos(page) -> list:
    """Extrai todos os blocos de horário — detecta dia corretamente."""
    sentidos = []

    # Pega todos os cards de dia (contém h3 com o nome do dia)
    cards_dia = page.locator(".rounded-lg.border.bg-card .p-4")

    for i in range(cards_dia.count()):
        card = cards_dia.nth(i)

        # Dia da semana pelo h3
        try:
            dia_texto = card.locator("h3").first.inner_text().strip()
            dia = identificar_dia(dia_texto)
        except Exception:
            continue

        if not dia:
            continue

        # Blocos de sentido (cada um tem "Saindo de X → Y")
        headers = card.locator("div.mb-3")
        for j in range(headers.count()):
            header = headers.nth(j)
            texto_header = header.inner_text().strip()

            if "Saindo de" not in texto_header or "→" not in texto_header:
                continue

            spans = header.locator("span")
            origem_bloco = ""
            destino_bloco = ""
            for k in range(spans.count()):
                t = spans.nth(k).inner_text().strip()
                if t.startswith("Saindo de"):
                    origem_bloco = t.replace("Saindo de", "").strip()
                elif "→" in t:
                    destino_bloco = re.sub(r"\(.*?\)", "", t.replace("→", "")).strip()

            if not origem_bloco or not destino_bloco:
                continue

            # Botões de horário dentro do bloco pai do header
            bloco = header.locator("xpath=parent::*").first
            botoes = bloco.locator("button")
            horarios = []
            for k in range(botoes.count()):
                botao = botoes.nth(k)
                texto_botao = botao.inner_text().strip()
                match = re.search(r"\b(\d{1,2}:\d{2})\b", texto_botao)
                if not match:
                    continue
                horario = match.group(1)
                classes = botao.get_attribute("class") or ""
                tipo = "intermediario" if "amber" in classes else "rodoviaria"
                horarios.append({"horario": horario, "tipo": tipo})

            if horarios:
                sentidos.append({
                    "diaDaSemana": dia,
                    "origem": origem_bloco,
                    "destino": destino_bloco,
                    "horarios": sorted(horarios, key=lambda h: h["horario"]),
                })

    return sentidos


def extrair_tarifas(page) -> list:
    tarifas = []
    try:
        tickets = page.locator(".lucide-ticket")
        vistos = set()
        for i in range(tickets.count()):
            container = tickets.nth(i).locator(
                "xpath=ancestor::div[contains(@class,'flex items-center')]"
            ).first
            texto = container.inner_text().strip()
            partes = [p.strip() for p in texto.split("\n") if p.strip()]
            if len(partes) >= 2:
                chave = partes[0] + partes[1]
                if chave not in vistos:
                    vistos.add(chave)
                    tarifas.append({"tipo": partes[0], "valor": partes[1]})
    except Exception:
        pass
    return tarifas


def extrair_linha(page) -> str:
    try:
        bus_icons = page.locator(".lucide-bus")
        for i in range(bus_icons.count()):
            parent = bus_icons.nth(i).locator("xpath=parent::*").first
            texto = parent.inner_text().strip()
            if " X " in texto and len(texto) < 60:
                return texto
    except Exception:
        pass
    return ""


def scrape(origem: str, destino: str) -> dict:
    with sync_playwright() as p:
        print(f"\nAbrindo {URL}...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"Accept-Language": "pt-BR,pt;q=0.9"})

        try:
            page.goto(URL, wait_until="networkidle", timeout=30000)
        except PlaywrightTimeout:
            print("Timeout no carregamento, continuando...")

        page.wait_for_timeout(2000)
        fechar_popup(page)

        # Lista cidades
        print("\nListando cidades...")
        cidades = listar_cidades(page)
        print(f"  {len(cidades)} cidades encontradas")

        if not selecionar_cidade(page, "Selecionar origem", origem):
            browser.close()
            return {"erro": f"Origem '{origem}' nao encontrada. Disponiveis: {cidades}"}

        fechar_popup(page)

        if not selecionar_cidade(page, "Selecionar destino", destino):
            browser.close()
            return {"erro": f"Destino '{destino}' nao encontrado. Disponiveis: {cidades}"}

        fechar_popup(page)

        print("\nAguardando horarios...")
        try:
            page.wait_for_selector("div.mb-3", timeout=15000)
        except PlaywrightTimeout:
            print("Timeout aguardando horarios")

        page.wait_for_timeout(1500)
        fechar_popup(page)

        linha = extrair_linha(page)
        tarifas = extrair_tarifas(page)

        print("Extraindo horarios de ida...")
        sentidos = extrair_sentidos(page)

        # Tenta clicar em "Ver horários de volta"
        try:
            fechar_popup(page)
            volta_btns = page.locator("button").filter(has_text="horários de volta")
            if volta_btns.count() > 0 and volta_btns.first.is_visible():
                print("Buscando horarios de volta...")
                volta_btns.first.click()
                page.wait_for_timeout(1500)
                fechar_popup(page)
                sentidos_volta = extrair_sentidos(page)
                chaves = {(s["diaDaSemana"], s["origem"], s["destino"]) for s in sentidos}
                for s in sentidos_volta:
                    if (s["diaDaSemana"], s["origem"], s["destino"]) not in chaves:
                        sentidos.append(s)
        except Exception as e:
            print(f"Volta: {e}")

        browser.close()

        return {
            "origem": origem,
            "destino": destino,
            "linha": linha or f"{origem} X {destino}",
            "tarifas": tarifas,
            "sentidos": sentidos,
            "cidades_disponiveis": cidades,
            "pesquisado_em": datetime.datetime.now().isoformat(),
        }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--origem", default="Brodowski")
    parser.add_argument("--destino", default="Ribeirão Preto")
    args = parser.parse_args()

    print(f"Buscando: {args.origem} -> {args.destino}")
    dados = scrape(args.origem, args.destino)

    if "erro" in dados:
        print(f"\nErro: {dados['erro']}")
        sys.exit(1)

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8", errors="replace") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)

    total = sum(len(s["horarios"]) for s in dados["sentidos"])
    print(f"\nConcluido!")
    print(f"  Linha: {dados['linha']}")
    print(f"  Tarifas: {dados['tarifas']}")
    print(f"  Sentidos: {len(dados['sentidos'])}")
    print(f"  Total horarios: {total}")
    print(f"  Salvo em: {OUTPUT}")


if __name__ == "__main__":
    main()
