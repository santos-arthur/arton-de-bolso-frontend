"use client";

import { useEffect } from "react";
import { useFoundry } from "./foundry-provider";
import type { EstadoNegocios } from "./foundry-types";

/**
 * Os negócios do personagem aberto, pedidos ao relay na montagem da tela. Daí
 * em diante chegam sozinhos: o rendimento apurado, o ativo que o mestre
 * contratou e o nível que subiu vêm pelo push (ver `obterNegocios` no módulo).
 * Trocar de personagem também troca a lista — quem a reenvia é o relay.
 */
export function useNegocios(): EstadoNegocios | null {
  const { negocios, carregarNegocios } = useFoundry();

  useEffect(() => {
    carregarNegocios();
    // Só na montagem, como em `useCombate`: `carregarNegocios` é recriado a
    // cada render do provider, e cada push provoca um render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return negocios;
}

/** Formata tibares como o módulo faz no chat: "T$ 1.200", com sinal só no negativo. */
export function tibares(valor: number) {
  const n = Math.abs(Math.round(valor));
  return `${valor < 0 ? "−" : ""}T$ ${n.toLocaleString("pt-BR")}`;
}
