"use client";

import {
  faChevronDown,
  faDiceD20,
  faEye,
  faGear,
  faHouse,
  faRightFromBracket,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFoundry } from "../lib/foundry-provider";

/**
 * Barra de menu principal — navegação entre as telas do app (home,
 * configurações, sair). É deliberadamente separada do dock inferior
 * (<Navegacao />), que só troca de aba *dentro* de uma ficha: um menu por
 * nível de navegação, e nenhum dos dois disputa o mesmo canto da tela no
 * celular.
 */
export default function BarraPrincipal() {
  const { ficha, somenteLeitura, logout } = useFoundry();
  const pathname = usePathname();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha em Escape ou clique fora — um dropdown sem isso fica preso aberto
  // no celular, onde não existe "clicar em outro lugar" óbvio.
  useEffect(() => {
    if (!menuAberto) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setMenuAberto(false);
    }
    function aoClicar(evento: MouseEvent) {
      if (!menuRef.current?.contains(evento.target as Node)) setMenuAberto(false);
    }

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicar);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicar);
    };
  }, [menuAberto]);

  const itensMenu: { rotulo: string; href?: string; icone: IconDefinition; acao?: () => void }[] = [
    { rotulo: "Início", href: "/", icone: faHouse },
    ...(ficha ? [{ rotulo: `Ficha de ${ficha.nome}`, href: "/detalhes", icone: faUser }] : []),
    { rotulo: "Configurações", href: "/configuracoes", icone: faGear },
    { rotulo: "Sair", icone: faRightFromBracket, acao: () => logout() }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-red-900 bg-olive-400/95 text-olive-800 shadow-sm backdrop-blur-md dark:bg-olive-900/95 dark:text-olive-400">
      <div className="mx-auto flex h-14 w-full max-w-7xl flex-row items-center justify-between gap-3 px-4 min-[1313px]:px-0">
        <Link href="/" className="flex min-w-0 flex-row items-center gap-2 rounded-lg px-1 py-1 transition-colors hover:bg-black/5 dark:hover:bg-white/5">
          <FontAwesomeIcon icon={faDiceD20} className="size-6! shrink-0 text-red-900" />
          <span className="truncate text-lg font-bold sm:text-xl">Arton de Bolso</span>
        </Link>

        <div ref={menuRef} className="relative flex shrink-0 flex-row items-center gap-2">
          {ficha && (
            <Link
              href="/detalhes"
              className="hidden max-w-56 flex-row items-center gap-2 rounded-full border-2 border-red-900 py-1 pl-1 pr-3 text-sm font-semibold transition-colors hover:bg-black/5 sm:flex dark:hover:bg-white/5"
            >
              {ficha.img ? (
                <span
                  role="img"
                  aria-hidden="true"
                  className="size-7 shrink-0 rounded-full border border-red-900 bg-cover bg-center"
                  style={{ backgroundImage: `url(${ficha.img})` }}
                />
              ) : (
                <FontAwesomeIcon icon={faUser} className="size-5! shrink-0" />
              )}
              <span className="truncate">{ficha.nome}</span>
              {somenteLeitura && <FontAwesomeIcon icon={faEye} className="size-3.5! shrink-0 opacity-70" title="Somente leitura" />}
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-haspopup="menu"
            aria-expanded={menuAberto}
            aria-label="Menu principal"
            className="flex flex-row items-center gap-1.5 rounded-full border-2 border-red-900 px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <FontAwesomeIcon icon={faGear} className="size-4.5!" />
            <FontAwesomeIcon icon={faChevronDown} className={`size-3! transition-transform ${menuAberto ? "rotate-180" : ""}`} />
          </button>

          {menuAberto && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 flex w-60 flex-col gap-1 rounded-xl border-2 border-red-900 bg-olive-300 p-2 shadow-2xl dark:bg-olive-900"
            >
              {itensMenu.map((item) => {
                const conteudo = (
                  <>
                    <FontAwesomeIcon icon={item.icone} className="size-4! shrink-0 opacity-70" />
                    <span className="truncate">{item.rotulo}</span>
                  </>
                );
                const classe = `flex w-full flex-row items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                  item.href && pathname === item.href ? "bg-red-900 text-olive-50" : "hover:bg-black/5 dark:hover:bg-white/5"
                }`;

                return item.href ? (
                  // A barra não desmonta ao navegar, então o fechamento é
                  // explícito no clique.
                  <Link
                    key={item.rotulo}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setMenuAberto(false)}
                    className={classe}
                  >
                    {conteudo}
                  </Link>
                ) : (
                  <button
                    key={item.rotulo}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAberto(false);
                      item.acao?.();
                    }}
                    className={classe}
                  >
                    {conteudo}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
