"use client";

import { useState, type KeyboardEvent } from "react";

/**
 * Liga um <input type="number"> a um valor que vive no servidor.
 *
 * Enquanto o campo está sendo editado ele guarda um rascunho local e ignora o
 * valor que chega de fora — sem isso, cada tecla viraria uma escrita no
 * Foundry (digitar "12" passa por "1") e um push do relay no meio da
 * digitação sobrescreveria o que está sendo escrito. O valor só é enviado ao
 * sair do campo ou no Enter; Escape descarta o rascunho.
 */
export function useCampoNumerico(
  valor: number,
  aoConfirmar: (novo: number) => void,
  { min = 0, max }: { min?: number; max?: number } = {}
) {
  const [rascunho, setRascunho] = useState<string | null>(null);

  function confirmar() {
    if (rascunho === null) return;
    const bruto = Number(rascunho);
    setRascunho(null);
    if (Number.isNaN(bruto)) return;
    const limitado = Math.max(min, max === undefined ? bruto : Math.min(max, bruto));
    if (limitado !== valor) aoConfirmar(limitado);
  }

  return {
    // Fora da edição o campo espelha o servidor; durante, o rascunho manda.
    value: rascunho ?? String(valor),
    onFocus: () => setRascunho(String(valor)),
    onChange: (evento: { target: { value: string } }) => setRascunho(evento.target.value),
    onBlur: confirmar,
    onKeyDown: (evento: KeyboardEvent<HTMLInputElement>) => {
      if (evento.key === "Enter") evento.currentTarget.blur();
      if (evento.key === "Escape") {
        setRascunho(null);
        evento.currentTarget.blur();
      }
    }
  };
}
