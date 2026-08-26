"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { FaChevronDown } from "react-icons/fa6";

/**
 * Select com a cara do app. Sem `appearance-none` o navegador desenha o
 * widget do sistema, e aí a métrica é dele: no iPhone a caixa vinha com
 * altura, recuo e seta próprios, diferente do resto dos campos. Zerada a
 * aparência, a seta passa a ser nossa — e o `pr-9` é o lugar dela.
 *
 * A lista que abre ao tocar continua sendo a nativa, de propósito: no celular
 * ela é bem mais rápida de percorrer do que qualquer dropdown que possamos
 * desenhar.
 */
export default function CampoSelect({
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <span className="relative flex flex-col">
      <select
        {...props}
        className={`min-h-11 w-full appearance-none rounded-xl border border-borda bg-superficie-alta pl-3 pr-9 text-sm outline-none focus:border-acento ${className}`}
      >
        {children}
      </select>
      <FaChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-3 -translate-y-1/2 opacity-40"
      />
    </span>
  );
}
