"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(max-width: 639px)";

function assinar(aoMudar: () => void) {
  const mq = window.matchMedia(CONSULTA);
  mq.addEventListener("change", aoMudar);
  return () => mq.removeEventListener("change", aoMudar);
}

/**
 * `true` abaixo de 640px. Serve para trocar o *padrão de interação*, não só o
 * estilo: no celular não existe hover, e um popover ancorado ao elemento é
 * pequeno, some com o dedo em cima e briga com a rolagem — lá o certo é um
 * painel que sobe do rodapé.
 *
 * O terceiro argumento é o valor no servidor: `false` faz o SSR renderizar a
 * variante de desktop, e o primeiro efeito no cliente corrige. Como todo
 * detalhamento só aparece depois de um toque, isso nunca pisca na tela.
 */
export function useTelaPequena() {
  return useSyncExternalStore(
    assinar,
    () => window.matchMedia(CONSULTA).matches,
    () => false
  );
}
