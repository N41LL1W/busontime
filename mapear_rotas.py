# -*- coding: utf-8 -*-
"""
mapear_rotas.py - Coloque na raiz: busontime/mapear_rotas.py

Abre o site UMA vez e mapeia todas as combinações origem → destinos disponíveis.
Salva em: public/rotas-saobento.json

Uso:
  .venv\Scripts\python.exe mapear_rotas.py
"""

import json
import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

URL = "https://semiurbano.lovable.app/horarios"
OUTPUT = Path("public/rotas-saobento.json")


def fechar_popup(page):
    try:
        dialog = page.locator('[role="dialog"]')
        if dialog.count() > 0 and dialog.first.is_visible():
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)
            if dialog.first.is_visible():
                page.mouse.click(10, 10)
                page.wait_for_timeout(400)
    except Exception:
        pass


def listar_opcoes_dropdown(page, aria_label: str) -> list:
    """Abre um dropdown e retorna todas as opções visíveis."""
    try:
        btn = page.get_by_role("button", name=aria_label)
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
    except Exception as e:
        print(f"  Erro ao listar {aria_label}: {e}")
        page.keyboard.press("Escape")
        return []


def selecionar_cidade(page, aria_label: str, cidade: str) -> bool:
    try:
        btn = page.get_by_role("button", name=aria_label)
        btn.click()
        page.wait_for_timeout(600)

        import unicodedata
        def norm(t):
            t = unicodedata.normalize("NFD", t)
            return "".join(c for c in t if unicodedata.category(c) != "Mn").lower().strip()

        opcoes = page.locator('[role="option"]')
        cidade_norm = norm(cidade)
        for i in range(opcoes.count()):
            opcao = opcoes.nth(i)
            if cidade_norm in norm(opcao.inner_text()):
                opcao.click()
                page.wait_for_timeout(500)
                return True

        page.keyboard.press("Escape")
        return False
    except Exception:
        page.keyboard.press("Escape")
        return False


def limpar_selecao(page, aria_label: str):
    """Clica no X para limpar a seleção do campo."""
    try:
        # O botão de limpar fica dentro do mesmo container do dropdown
        # aria-label "Limpar seleção" ou ícone X
        limpar = page.locator(f'[aria-label="Limpar seleção"]')
        if limpar.count() > 0 and limpar.first.is_visible():
            limpar.first.click()
            page.wait_for_timeout(400)
            return True
    except Exception:
        pass

    # Fallback: recarrega a página
    return False


def mapear(page) -> dict:
    """Mapeia origem → [destinos] para todas as cidades."""
    mapa = {}

    # Pega todas as origens disponíveis
    print("\nListando todas as origens...")
    origens = listar_opcoes_dropdown(page, "Selecionar origem")
    print(f"  {len(origens)} origens: {', '.join(origens)}")

    for i, origem in enumerate(origens):
        print(f"\n[{i+1}/{len(origens)}] Origem: {origem}")

        # Seleciona a origem
        ok = selecionar_cidade(page, "Selecionar origem", origem)
        if not ok:
            print(f"  Nao conseguiu selecionar '{origem}', pulando...")
            continue

        fechar_popup(page)
        page.wait_for_timeout(300)

        # Lista os destinos disponíveis para essa origem
        destinos = listar_opcoes_dropdown(page, "Selecionar destino")
        print(f"  {len(destinos)} destinos: {', '.join(destinos)}")
        mapa[origem] = destinos

        # Limpa a seleção de origem para a próxima iteração
        # Tenta clicar no X de limpar
        limpo = False
        try:
            limpars = page.locator('[aria-label*="Limpar" i]')
            if limpars.count() > 0:
                limpars.first.click()
                page.wait_for_timeout(400)
                limpo = True
        except Exception:
            pass

        # Se não conseguiu limpar, recarrega
        if not limpo:
            try:
                page.reload(wait_until="networkidle", timeout=20000)
                page.wait_for_timeout(1500)
                fechar_popup(page)
            except Exception:
                pass

    return mapa


def main():
    with sync_playwright() as p:
        print(f"Abrindo {URL}...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.set_extra_http_headers({"Accept-Language": "pt-BR,pt;q=0.9"})

        try:
            page.goto(URL, wait_until="networkidle", timeout=30000)
        except PlaywrightTimeout:
            print("Timeout no carregamento, continuando...")

        page.wait_for_timeout(2000)
        fechar_popup(page)

        mapa = mapear(page)
        browser.close()

    # Salva
    resultado = {
        "mapa": mapa,
        "todas_cidades": sorted(set(mapa.keys())),
        "gerado_em": datetime.datetime.now().isoformat(),
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(resultado, f, ensure_ascii=False, indent=2)

    print(f"\nConcluido!")
    print(f"  {len(mapa)} origens mapeadas")
    total_combos = sum(len(v) for v in mapa.values())
    print(f"  {total_combos} combinacoes origem->destino")
    print(f"  Salvo em: {OUTPUT}")


if __name__ == "__main__":
    main()
