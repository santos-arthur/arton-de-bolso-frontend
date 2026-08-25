"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export type ItemDetalhe = { rotulo: string; valor: number };

export function formatarBonus(valor: number) {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}

/**
 * Gatilho + popover de detalhamento reutilizável: abre no hover ou ao clicar
 * (fica travado, fechando só ao clicar fora), sempre no topo (z-50) e
 * reposicionado via JS pra nunca vazar da tela. O visual do próprio gatilho
 * (fieldset) e do conteúdo dentro dele fica por conta de quem usa.
 */
export default function CampoComDetalhe({
  itens,
  total,
  temporario,
  classeContainer = "relative h-full min-w-0",
  classeGatilho,
  children,
}: {
  itens: ItemDetalhe[];
  total: number;
  temporario?: number;
  classeContainer?: string;
  classeGatilho: string;
  children: ReactNode;
}) {
  const [travado, setTravado] = useState(false);
  const [emHover, setEmHover] = useState(false);
  const aberto = travado || emHover;
  const containerRef = useRef<HTMLDivElement>(null);
  const detalheRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!travado) return;

    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      const dentroDoGatilho = containerRef.current?.contains(alvo);
      const dentroDoPopover = detalheRef.current?.contains(alvo);
      if (!dentroDoGatilho && !dentroDoPopover) {
        setTravado(false);
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    return () => document.removeEventListener("mousedown", aoClicarFora);
  }, [travado]);

  // O popover é renderizado via portal direto no <body> (ver return), pra não
  // ficar sujeito a nenhum ancestral com overflow-hidden pelo caminho — por
  // isso a posição é calculada em coordenadas absolutas de viewport (position:
  // fixed) e não mais como offset relativo ao gatilho. Mantém sempre 100%
  // visível: abre exatamente abaixo do gatilho, centralizado, e só desloca
  // (nos dois eixos) o suficiente para caber com 16px de margem da borda da
  // tela. useLayoutEffect evita flash antes do ajuste.
  useLayoutEffect(() => {
    const popover = detalheRef.current;
    const gatilho = containerRef.current;
    if (!aberto || !popover || !gatilho) return;

    const margem = 16;
    const espacamento = 8; // equivalente ao "mt-2" usado antes
    const gatilhoRect = gatilho.getBoundingClientRect();
    const largura = popover.offsetWidth;
    const altura = popover.offsetHeight;
    // window.innerWidth/innerHeight não são confiáveis em navegadores mobile
    // (podem refletir o viewport "de layout", maior que a tela visível).
    // document.documentElement.clientWidth/clientHeight refletem a área real.
    const larguraTela = document.documentElement.clientWidth;
    const alturaTela = document.documentElement.clientHeight;

    // Horizontal: centralizado sob o gatilho, por padrão.
    let esquerda = gatilhoRect.left + gatilhoRect.width / 2 - largura / 2;

    if (esquerda < margem) {
      esquerda = margem;
    } else if (esquerda + largura > larguraTela - margem) {
      esquerda = larguraTela - margem - largura;
    }

    // Vertical: sempre abaixo do gatilho, por padrão; só sobe o necessário
    // para caber quando a tela é baixa demais (ex.: celular em paisagem).
    let topo = gatilhoRect.bottom + espacamento;

    if (topo + altura > alturaTela - margem) {
      topo = alturaTela - margem - altura;
    }

    popover.style.left = `${esquerda}px`;
    popover.style.top = `${topo}px`;
  }, [aberto]);

  return (
    <div
      ref={containerRef}
      className={classeContainer}
      onMouseEnter={() => setEmHover(true)}
      onMouseLeave={() => setEmHover(false)}
    >
      <fieldset
        role="button"
        tabIndex={0}
        onClick={() => setTravado((valor) => !valor)}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            setTravado((valor) => !valor);
          }
        }}
        className={`cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-900 ${classeGatilho}`}
      >
        {children}
      </fieldset>

      {/* Detalhamento: aparece no hover ou ao clicar (fica travado, fechando só
          ao clicar fora). Renderizado via portal direto no body (não escapa
          para "fixed" só relativo ao gatilho, e sim em coordenadas de tela),
          pra nunca ser cortado por um ancestral com overflow-hidden pelo
          caminho. Sempre no topo (z-50) e reposicionado via JS para nunca
          vazar para fora da tela. */}
      {aberto &&
        createPortal(
          <div
            ref={detalheRef}
            onMouseEnter={() => setEmHover(true)}
            onMouseLeave={() => setEmHover(false)}
            className="fixed z-50 flex w-60 max-w-[calc(100vw-2rem)] flex-col gap-1 rounded-lg border-2 border-red-900 bg-olive-300 p-3 text-sm text-olive-800 shadow-lg dark:bg-olive-800 dark:text-olive-400"
          >
            {itens.map((item, indice) => (
              <div key={item.rotulo} className="flex flex-row items-center justify-between gap-4">
                <span>{item.rotulo}</span>
                <span className="font-semibold">
                  {indice === 0 ? item.valor : formatarBonus(item.valor)}
                </span>
              </div>
            ))}
            <div className="mt-1 flex flex-row items-center justify-between gap-4 border-t border-red-900/40 pt-1 font-bold">
              <span>Total</span>
              <span>{total}</span>
            </div>
            {!!temporario && temporario > 0 && (
              <div className="flex flex-row items-center justify-between gap-4 text-olive-800/70 dark:text-olive-400/70">
                <span>Temporários</span>
                <span className="font-semibold">+{temporario}</span>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}
