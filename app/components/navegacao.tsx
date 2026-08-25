"use client";

import { faBars, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const ITENS_NAV = [
  { rotulo: "Detalhes", href: "/" },
  { rotulo: "Combate", href: "/combate" },
  { rotulo: "Perícias", href: "/pericias" },
  { rotulo: "Poderes", href: "/poderes" },
  { rotulo: "Inventário", href: "/inventario" },
  { rotulo: "Magias", href: "/magias" },
  { rotulo: "Configurações", href: "/configuracoes" },
];

type Retangulo = { top: number; left: number; width: number; height: number };

// Mede a posição do link ativo (relativa ao container) e devolve um retângulo
// pra desenhar o indicador colorido por cima — recalculado sempre que a rota
// muda, o que faz o indicador "deslizar" via transition do CSS.
function useIndicadorAtivo(
  containerRef: React.RefObject<HTMLDivElement | null>,
  linksRef: React.RefObject<Record<string, HTMLAnchorElement | null>>,
  pathname: string,
) {
  const [indicador, setIndicador] = useState<Retangulo | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const ativo = linksRef.current[pathname];
    if (!container || !ativo) {
      setIndicador(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const ativoRect = ativo.getBoundingClientRect();

    // top/left de um elemento absoluto são relativos à padding box do
    // ancestral posicionado, não à border box — por isso descontamos
    // clientTop/clientLeft (a espessura da borda) aqui.
    setIndicador({
      top: ativoRect.top - containerRect.top - container.clientTop,
      left: ativoRect.left - containerRect.left - container.clientLeft,
      width: ativoRect.width,
      height: ativoRect.height,
    });
  }, [pathname, containerRef, linksRef]);

  return indicador;
}

export default function Navegacao() {
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);

  const dockRef = useRef<HTMLDivElement>(null);
  const dockLinksRef = useRef<Record<string, HTMLAnchorElement | null>>({});
  const indicadorDock = useIndicadorAtivo(dockRef, dockLinksRef, pathname);

  const painelRef = useRef<HTMLDivElement>(null);
  const painelLinksRef = useRef<Record<string, HTMLAnchorElement | null>>({});
  const indicadorPainel = useIndicadorAtivo(painelRef, painelLinksRef, pathname);

  useEffect(() => {
    if (!menuAberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setMenuAberto(false);
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [menuAberto]);

  return (
    <>
      {/* Dock flutuante (estilo macOS): fixo na base da tela, a partir do md */}
      <nav className="pointer-events-none fixed inset-x-0 bottom-4 z-40 hidden justify-center px-4 md:flex">
        <div
          ref={dockRef}
          className="pointer-events-auto relative flex flex-row flex-wrap items-center gap-1 rounded-full border-2 border-red-900 bg-olive-300/90 p-1 text-olive-800 shadow-2xl backdrop-blur-md dark:bg-olive-900/90 dark:text-olive-400"
        >
          {indicadorDock && (
            <div
              className="absolute rounded-full bg-red-900 transition-all duration-300 ease-out"
              style={{
                top: indicadorDock.top,
                left: indicadorDock.left,
                width: indicadorDock.width,
                height: indicadorDock.height,
              }}
            />
          )}
          {ITENS_NAV.map((item) => {
            const ativo = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                ref={(el) => {
                  dockLinksRef.current[item.href] = el;
                }}
                aria-current={ativo ? "page" : undefined}
                className={`relative z-10 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  ativo
                    ? "text-olive-50"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                {item.rotulo}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Tela pequena: botão flutuante de hambúrguer que abre um menu lateral */}
      <button
        type="button"
        onClick={() => setMenuAberto(true)}
        aria-label="Abrir menu"
        aria-haspopup="true"
        aria-expanded={menuAberto}
        className="fixed bottom-4 right-4 z-40 flex size-12 items-center justify-center rounded-full border-2 border-red-900 bg-olive-300/90 text-olive-800 shadow-2xl backdrop-blur-md transition-colors hover:bg-olive-300 md:hidden dark:bg-olive-900/90 dark:text-olive-400 dark:hover:bg-olive-900"
      >
        <FontAwesomeIcon icon={faBars} className="size-5!" />
      </button>

      {/* Overlay + painel lateral (só existe/interage na tela pequena) */}
      <div
        className={`fixed inset-0 z-50 md:hidden ${
          menuAberto ? "" : "pointer-events-none"
        }`}
        aria-hidden={!menuAberto}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            menuAberto ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuAberto(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
          className={`absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col gap-1 border-r-2 border-red-900 bg-olive-300 p-4 text-olive-800 shadow-xl transition-transform duration-300 dark:bg-olive-900 dark:text-olive-400 ${
            menuAberto ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-2 flex flex-row items-center justify-between">
            <span className="text-lg font-bold">Menu</span>
            <button
              type="button"
              onClick={() => setMenuAberto(false)}
              aria-label="Fechar menu"
              className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <FontAwesomeIcon icon={faXmark} className="size-5!" />
            </button>
          </div>

          <div ref={painelRef} className="relative flex flex-col gap-1">
            {indicadorPainel && (
              <div
                className="absolute rounded-lg bg-red-900 transition-all duration-300 ease-out"
                style={{
                  top: indicadorPainel.top,
                  left: indicadorPainel.left,
                  width: indicadorPainel.width,
                  height: indicadorPainel.height,
                }}
              />
            )}
            {ITENS_NAV.map((item) => {
              const ativo = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={(el) => {
                    painelLinksRef.current[item.href] = el;
                  }}
                  onClick={() => setMenuAberto(false)}
                  aria-current={ativo ? "page" : undefined}
                  className={`relative z-10 rounded-lg border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    ativo
                      ? "border-red-900 text-olive-50"
                      : "border-transparent hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {item.rotulo}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
