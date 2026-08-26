"use client";

import { FaXmark } from "react-icons/fa6";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as EventoPonteiro,
  type ReactNode
} from "react";
import { createPortal } from "react-dom";
import { useTelaPequena } from "../lib/tela";

/** Altura da folha no celular; cada nível empilhado encolhe um degrau. */
const ALTURA_BASE = 640;
const DEGRAU = 16;

/** Arrastar além disto fecha; abaixo, a folha volta ao lugar. */
const LIMIAR_FECHAR = 96;
/** Alguns pixels de folga antes de assumir que é arraste, e não um toque. */
const TOLERANCIA = 6;
/** Tempo da animação de saída — casado com a duration da classe abaixo. */
const SAIDA_MS = 180;

/**
 * Profundidade de empilhamento. O contexto atravessa portais (segue a árvore
 * do React, não a do DOM), então uma folha aberta de dentro de outra sabe em
 * que nível está mesmo sendo renderizada no <body>.
 */
const NivelDaFolha = createContext(0);

/**
 * Diálogo que muda de forma com a tela: no celular sobe do rodapé (bottom
 * sheet), onde o polegar alcança; a partir de sm vira um modal centrado.
 *
 * No celular ele também fecha ao ser arrastado para baixo, como um app
 * nativo. O gesto vale a partir do cabeçalho — e do conteúdo, mas só quando
 * ele já está no topo, senão puxar para ler viraria fechar.
 *
 * Renderizado por portal no <body> — não por preferência, por necessidade:
 * `position: fixed` deixa de se ancorar no viewport dentro de qualquer
 * ancestral com `transform`, `filter` ou `backdrop-filter`, e a faixa de
 * recursos da ficha usa `backdrop-blur`.
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
  const telaPequena = useTelaPequena();
  const mioloRef = useRef<HTMLDivElement>(null);
  const origem = useRef<{ y: number; capturado: boolean } | null>(null);
  const [arrasto, setArrasto] = useState(0);
  const [saindo, setSaindo] = useState(false);

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

  function aoPressionar(evento: EventoPonteiro<HTMLElement>, doCabecalho: boolean) {
    if (!telaPequena || saindo) return;
    // A partir do conteúdo, só quando não há o que rolar para cima: senão o
    // gesto de leitura viraria fechamento.
    if (!doCabecalho && (mioloRef.current?.scrollTop ?? 0) > 0) return;
    origem.current = { y: evento.clientY, capturado: false };
  }

  function aoMover(evento: EventoPonteiro<HTMLElement>) {
    if (!origem.current) return;
    const delta = evento.clientY - origem.current.y;
    if (delta <= 0) {
      if (origem.current.capturado) setArrasto(0);
      return;
    }
    if (!origem.current.capturado) {
      if (delta < TOLERANCIA) return;
      origem.current.capturado = true;
      evento.currentTarget.setPointerCapture(evento.pointerId);
    }
    setArrasto(delta);
  }

  function aoSoltar() {
    if (!origem.current) return;
    const fechar = origem.current.capturado && arrasto > LIMIAR_FECHAR;
    origem.current = null;
    if (!fechar) {
      setArrasto(0);
      return;
    }
    setSaindo(true);
    setTimeout(onFechar, SAIDA_MS);
  }

  if (typeof document === "undefined") return null;

  const arrastando = arrasto > 0 && !saindo;
  // O véu clareia junto com o arraste: a folha "solta" da tela conforme desce.
  const opacidadeVeu = saindo ? 0 : Math.max(0.15, 1 - arrasto / (ALTURA_BASE * 0.9));

  return createPortal(
    // Uma folha aberta sobre outra fica um degrau mais baixa, deixando a de
    // trás aparecer — sem isso as duas se sobrepõem exatamente e não há
    // pista visual de que existe algo por baixo.
    <NivelDaFolha.Provider value={nivel + 1}>
      <div
        className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4"
        style={{ zIndex: 50 + nivel }}
        onClick={onFechar}
      >
        <div
          aria-hidden="true"
          className={`absolute inset-0 backdrop-blur-[2px] ${nivel === 0 ? "bg-black/50" : "bg-black/25"} ${
            arrastando ? "" : "transition-opacity duration-200"
          }`}
          style={{ opacity: opacidadeVeu }}
        />

        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          onClick={(evento) => evento.stopPropagation()}
          onPointerDown={(evento) => aoPressionar(evento, false)}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoSoltar}
          style={
            {
              "--altura-folha": `${ALTURA_BASE - nivel * DEGRAU}px`,
              transform: saindo ? "translateY(100%)" : arrasto ? `translateY(${arrasto}px)` : undefined
            } as CSSProperties
          }
          className={`area-segura-baixo relative flex h-[var(--altura-folha)] max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-borda bg-superficie shadow-2xl sm:h-auto sm:max-w-xl sm:rounded-2xl ${
            arrastando ? "" : "transition-transform duration-200 ease-out"
          }`}
        >
          {/* Puxador e cabeçalho: a área de pegada do gesto, com touch-action
              desligado para o navegador não disputar o movimento. */}
          <div
            onPointerDown={(evento) => aoPressionar(evento, true)}
            className="shrink-0 touch-none"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-foreground/25 sm:hidden" />
            <div className="flex flex-row items-center justify-between gap-3 px-5 pb-2 pt-3 sm:pt-5">
              <h2 className="font-display text-xl font-bold">{titulo}</h2>
              <button
                type="button"
                onClick={onFechar}
                aria-label="Fechar"
                className="rounded-full p-2 transition-colors hover:bg-foreground/5"
              >
                <FaXmark aria-hidden="true" className="size-4!" />
              </button>
            </div>
          </div>

          {/* Só o miolo rola — o título e as ações do rodapé continuam à mão por
              mais longa que seja a lista. pb-8 porque no celular a folha encosta
              na borda inferior da tela. */}
          <div
            ref={mioloRef}
            className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 pb-8"
          >
            {children}
          </div>

          {rodape && <div className="shrink-0 border-t border-borda px-5 py-3">{rodape}</div>}
        </div>
      </div>
    </NivelDaFolha.Provider>,
    document.body
  );
}
