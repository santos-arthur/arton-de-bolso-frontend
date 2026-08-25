"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createContext, useContext, useEffect, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Altura da folha no celular; cada nível empilhado encolhe um degrau. */
const ALTURA_BASE = 448;
const DEGRAU = 16;

/**
 * Profundidade de empilhamento. O contexto atravessa portais (segue a árvore
 * do React, não a do DOM), então uma folha aberta de dentro de outra sabe em
 * que nível está mesmo sendo renderizada no <body>.
 */
const NivelDaFolha = createContext(0);

/**
 * Diálogo que muda de forma com a tela: no celular sobe do rodapé (bottom
 * sheet), onde o polegar alcança; a partir de sm vira um modal centrado.
 * Um diálogo centrado no celular obriga a esticar o dedo até o meio da tela
 * e some atrás do teclado quando há campo numérico.
 *
 * Renderizado por portal no <body> — não por preferência, por necessidade:
 * `position: fixed` deixa de se ancorar no viewport dentro de qualquer
 * ancestral com `transform`, `filter` ou `backdrop-filter`, e a faixa de
 * recursos da ficha usa `backdrop-blur`. Sem o portal, a folha aberta a
 * partir dela (Defesa, PV/PM em leitura) abria fora da tela.
 */
export default function FolhaModal({
  titulo,
  onFechar,
  children,
  rodape
}: {
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  const nivel = useContext(NivelDaFolha);
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    // Trava a rolagem do fundo enquanto o diálogo está aberto.
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onFechar]);

  if (typeof document === "undefined") return null;

  return createPortal(
    // Uma folha aberta sobre outra fica um degrau mais baixa, deixando a de
    // trás aparecer — sem isso as duas se sobrepõem exatamente e não há
    // pista visual de que existe algo por baixo. O véu também clareia nos
    // níveis empilhados, para a de trás continuar legível.
    <NivelDaFolha.Provider value={nivel + 1}>
      <div
        className={`fixed inset-0 flex items-end justify-center backdrop-blur-[2px] sm:items-center sm:p-4 ${
          nivel === 0 ? "bg-black/50" : "bg-black/25"
        }`}
        style={{ zIndex: 50 + nivel }}
        onClick={onFechar}
      >
        {/* No celular a folha tem altura fixa (limitada pela tela pelo max-h),
            em vez de encolher até o conteúdo: painéis de tamanhos diferentes
            abrindo com alturas diferentes fazem a tela "pular" a cada toque.
            No desktop ela segue acompanhando o conteúdo. */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          onClick={(evento) => evento.stopPropagation()}
          style={{ "--altura-folha": `${ALTURA_BASE - nivel * DEGRAU}px` } as CSSProperties}
          className="area-segura-baixo flex h-[var(--altura-folha)] max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-borda bg-superficie shadow-2xl sm:h-auto sm:max-w-md sm:rounded-2xl"
        >
        {/* Puxador: no celular sinaliza que o painel veio de baixo. */}
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-foreground/20 sm:hidden" />

        <div className="flex shrink-0 flex-row items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-5">
          <h2 className="font-display text-xl font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-full p-2 transition-colors hover:bg-foreground/5"
          >
            <FontAwesomeIcon icon={faXmark} className="size-4!" />
          </button>
        </div>

        {/* Só o miolo rola — o título e as ações do rodapé continuam à mão por
            mais longa que seja a lista. pb-8 porque no celular a folha encosta
            na borda inferior da tela. */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 pb-8">{children}</div>

          {rodape && <div className="shrink-0 border-t border-borda px-5 py-3">{rodape}</div>}
        </div>
      </div>
    </NivelDaFolha.Provider>,
    document.body
  );
}
