"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import FolhaModal from "./folha-modal";
import { CAIXA_NUMERO, RotuloCampo } from "./visor-numero";
import { useTelaPequena } from "../lib/tela";

export type ItemDetalhe = { rotulo: string; valor: number };

export function formatarBonus(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

/** A decomposição em si — mesma informação no popover e no painel do celular. */
function ListaDetalhe({
  itens,
  total,
  temporario,
  grande = false
}: {
  itens: ItemDetalhe[];
  total: number;
  temporario?: number;
  grande?: boolean;
}) {
  return (
    <div className={`flex flex-col ${grande ? "text-base" : "gap-1 text-sm"}`}>
      {itens.map((item, indice) => (
        <div
          key={item.rotulo}
          className={`flex flex-row items-center justify-between gap-4 ${
            grande ? "border-b border-borda/60 py-2.5 last:border-b-0" : ""
          }`}
        >
          <span className="min-w-0 truncate opacity-80">{item.rotulo}</span>
          <span className="numero shrink-0 font-semibold">
            {indice === 0 ? item.valor : formatarBonus(item.valor)}
          </span>
        </div>
      ))}
      <div
        className={`flex flex-row items-center justify-between gap-4 border-t-2 border-borda font-bold ${
          grande ? "mt-1 pt-3 text-xl" : "mt-1 pt-1"
        }`}
      >
        <span>Total</span>
        <span className="numero">{total}</span>
      </div>
      {!!temporario && temporario > 0 && (
        <div className="flex flex-row items-center justify-between gap-4 opacity-60">
          <span>Temporários</span>
          <span className="numero font-semibold">+{temporario}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Gatilho + decomposição de um valor calculado (PV, PM, Defesa, atributos,
 * deslocamento). A forma muda com o dispositivo:
 *
 * - Telas grandes: popover no hover, ou travado no clique. É rápido e não
 *   interrompe a leitura.
 * - Celular: painel que sobe do rodapé. Hover não existe no toque, e o
 *   popover ancorado ficava sob o dedo, apertado e brigando com a rolagem.
 */
export default function CampoComDetalhe({
  itens,
  total,
  temporario,
  titulo,
  destaque,
  classeContainer = "relative h-full min-w-0",
  classeGatilho,
  children
}: {
  itens: ItemDetalhe[];
  total: number;
  temporario?: number;
  /** Cabeçalho do painel no celular — o popover não precisa, o gatilho fica visível ao lado. */
  titulo?: string;
  /**
   * Visor exibido no topo da folha do celular. Sem ele a folha mostra o total
   * grande. É o que faz o painel de leitura de PV/PM ficar idêntico ao de
   * edição, sem os controles.
   */
  destaque?: ReactNode;
  classeContainer?: string;
  classeGatilho: string;
  children: ReactNode;
}) {
  const telaPequena = useTelaPequena();
  const [travado, setTravado] = useState(false);
  const [emHover, setEmHover] = useState(false);
  const aberto = travado || (!telaPequena && emHover);
  const containerRef = useRef<HTMLDivElement>(null);
  const detalheRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!travado || telaPequena) return;

    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (!containerRef.current?.contains(alvo) && !detalheRef.current?.contains(alvo)) {
        setTravado(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [travado, telaPequena]);

  // O popover é renderizado via portal direto no <body>, pra não ficar sujeito
  // a nenhum ancestral com overflow-hidden pelo caminho — por isso a posição é
  // calculada em coordenadas de viewport (position: fixed). Mantém-se sempre
  // visível: abre abaixo do gatilho, centralizado, e só desloca o suficiente
  // para caber com 16px de margem. useLayoutEffect evita flash antes do ajuste.
  useLayoutEffect(() => {
    if (telaPequena) return;
    const popover = detalheRef.current;
    const gatilho = containerRef.current;
    if (!aberto || !popover || !gatilho) return;

    const margem = 16;
    const espacamento = 8;
    const gatilhoRect = gatilho.getBoundingClientRect();
    const largura = popover.offsetWidth;
    const altura = popover.offsetHeight;
    // clientWidth/clientHeight do documento refletem a área realmente visível;
    // window.innerWidth/innerHeight não são confiáveis em navegadores mobile.
    const larguraTela = document.documentElement.clientWidth;
    const alturaTela = document.documentElement.clientHeight;

    let esquerda = gatilhoRect.left + gatilhoRect.width / 2 - largura / 2;
    if (esquerda < margem) esquerda = margem;
    else if (esquerda + largura > larguraTela - margem) esquerda = larguraTela - margem - largura;

    let topo = gatilhoRect.bottom + espacamento;
    if (topo + altura > alturaTela - margem) topo = alturaTela - margem - altura;

    popover.style.left = `${esquerda}px`;
    popover.style.top = `${topo}px`;
  }, [aberto, telaPequena]);

  const gatilho = (
    <div
      ref={containerRef}
      className={classeContainer}
      onMouseEnter={() => setEmHover(true)}
      onMouseLeave={() => setEmHover(false)}
    >
      <fieldset
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-expanded={aberto}
        onClick={() => setTravado((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            setTravado((valor) => !valor);
          }
        }}
        className={`cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento ${classeGatilho}`}
      >
        {children}
      </fieldset>
    </div>
  );

  if (telaPequena) {
    return (
      <>
        {gatilho}
        {travado && (
          <FolhaModal titulo={titulo ?? "Detalhamento"} onFechar={() => setTravado(false)}>
            {destaque ?? (
              <div className="flex flex-col items-center gap-1">
                <RotuloCampo>Total</RotuloCampo>
                <span className={CAIXA_NUMERO}>{total}</span>
              </div>
            )}
            <ListaDetalhe itens={itens} total={total} temporario={temporario} grande />
          </FolhaModal>
        )}
      </>
    );
  }

  return (
    <>
      {gatilho}
      {aberto &&
        createPortal(
          <div
            ref={detalheRef}
            onMouseEnter={() => setEmHover(true)}
            onMouseLeave={() => setEmHover(false)}
            className="fixed z-50 flex w-60 max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-borda bg-superficie p-3 text-foreground shadow-2xl"
          >
            <ListaDetalhe itens={itens} total={total} temporario={temporario} />
          </div>,
          document.body
        )}
    </>
  );
}
