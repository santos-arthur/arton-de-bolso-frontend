"use client";

import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";

export default function SelectPersonalizado<T extends string>({
  valor,
  opcoes,
  aoMudar,
}: {
  valor: T;
  opcoes: readonly T[];
  aoMudar: (valor: T) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setAberto((atual) => !atual)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
        className="flex w-full flex-row items-center justify-between gap-2 rounded-lg border-2 border-red-900 bg-transparent px-3 py-2 text-left"
      >
        <span>{valor}</span>
        <FontAwesomeIcon icon={faChevronDown} className="size-3.5! opacity-70" />
      </button>

      {aberto && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-10 mt-1 w-full overflow-hidden rounded-lg border-2 border-red-900 bg-olive-300 shadow-lg dark:bg-olive-900"
        >
          {opcoes.map((opcao, indice) => (
            <li key={opcao} role="option" aria-selected={opcao === valor}>
              {indice > 0 && <div className="border-t border-red-900/40" />}
              <button
                type="button"
                onClick={() => {
                  aoMudar(opcao);
                  setAberto(false);
                }}
                className={`flex w-full flex-row items-center px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${
                  opcao === valor ? "bg-black/5 dark:bg-white/10" : ""
                }`}
              >
                {opcao}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
