"use client";

import { useState } from "react";
import { Bell, BellOff, X, Check, Zap } from "lucide-react";
import { useAlarmes, type Intervalo } from "../hooks/useAlarmes";

interface BotaoAlarmeProps {
  horario: string;
  origem: string;
  destino: string;
  empresa: string;
}

const OPCOES: { valor: Intervalo; label: string }[] = [
  { valor: 60, label: "60 min antes" },
  { valor: 30, label: "30 min antes" },
  { valor: 15, label: "15 min antes" },
  { valor: 5,  label: "5 min antes"  },
];

export default function BotaoAlarme({ horario, origem, destino, empresa }: BotaoAlarmeProps) {
  const { temAlarme, getAlarme, adicionarAlarme, removerAlarme, atualizarIntervalos, permissao, solicitarPermissao } = useAlarmes();
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [testeMsg, setTesteMsg] = useState<string | null>(null);

  const ativo = temAlarme(horario, origem, destino);
  const alarme = getAlarme(horario, origem, destino);
  const [selecionados, setSelecionados] = useState<Intervalo[]>(alarme?.intervalos ?? [30, 15, 5]);

  function toggleIntervalo(v: Intervalo) {
    setSelecionados((prev) => prev.includes(v) ? prev.filter((i) => i !== v) : [...prev, v].sort((a, b) => b - a));
  }

  async function salvar() {
    if (selecionados.length === 0) return;
    setSalvando(true);
    if (alarme) atualizarIntervalos(alarme.id, selecionados);
    else await adicionarAlarme({ horario, origem, destino, empresa, intervalos: selecionados });
    setSalvando(false);
    setAberto(false);
  }

  function remover() {
    if (alarme) removerAlarme(alarme.id);
    setAberto(false);
  }

  async function testarAgora() {
    setTesteMsg(null);
    if (!("Notification" in window)) { setTesteMsg("Este navegador não suporta notificações."); return; }
    let perm = Notification.permission;
    if (perm !== "granted") {
      const ok = await solicitarPermissao();
      perm = ok ? "granted" : "denied";
    }
    if (perm !== "granted") { setTesteMsg("Permissão negada. Verifique nas configurações do navegador/Windows."); return; }
    try {
      new Notification("🚌 Teste de notificação", { body: "Se você está vendo isso, funciona!", icon: "/favicon.svg" });
      setTesteMsg("Enviada — verifique o canto da tela.");
    } catch (err) {
      setTesteMsg(`Erro: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <>
      <button
        onClick={() => { setSelecionados(alarme?.intervalos ?? [30, 15, 5]); setTesteMsg(null); setAberto(true); }}
        className={`p-1.5 rounded-full transition-colors ${ativo ? "text-primary bg-primary/10 hover:bg-primary/20" : "text-muted-foreground/50 hover:text-primary hover:bg-primary/10"}`}
        title={ativo ? "Alarme configurado" : "Configurar alarme"}
      >
        {ativo ? <Bell size={14} className="fill-primary" /> : <Bell size={14} />}
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && setAberto(false)}>
          <div className="w-full max-w-sm rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <p className="font-semibold text-foreground">🔔 Alarme para {horario}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{origem} → {destino}</p>
              </div>
              <button onClick={() => setAberto(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {permissao === "denied" && (
              <div className="mx-5 mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-700 dark:text-red-300">
                ⚠️ Bloqueadas. Clique no cadeado ao lado da URL e permita notificações.
              </div>
            )}

            <div className="px-5 py-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground mb-3">Notificar quanto tempo antes?</p>
              {OPCOES.map(({ valor, label }) => {
                const marcado = selecionados.includes(valor);
                return (
                  <button key={valor} onClick={() => toggleIntervalo(valor)} className={`w-full flex items-center justify-between rounded-xl px-4 py-3 border transition-all text-sm ${marcado ? "border-primary bg-primary/5 text-primary" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40"}`}>
                    <span className="font-medium">{label}</span>
                    {marcado && <Check size={16} className="text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="px-5 pb-2 space-y-2">
              <p className="text-xs text-muted-foreground">Empresa: <span className="font-medium">{empresa}</span></p>
              <p className="text-xs text-muted-foreground">⚠️ Funciona com o navegador aberto (pode estar em outra aba).</p>
              <button onClick={testarAgora} className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
                <Zap size={12} /> Testar notificação agora
              </button>
              {testeMsg && <p className="text-xs text-center text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">{testeMsg}</p>}
            </div>

            <div className="flex gap-2 px-5 py-4 border-t">
              {ativo && (
                <button onClick={remover} className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <BellOff size={14} /> Remover
                </button>
              )}
              <button onClick={salvar} disabled={selecionados.length === 0 || salvando || permissao === "denied"} className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Bell size={14} /> {salvando ? "Salvando..." : ativo ? "Atualizar alarme" : "Ativar alarme"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}