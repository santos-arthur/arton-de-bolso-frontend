"use client";

import { useEffect } from "react";
import { useFoundry } from "./foundry-provider";
import type { EstadoBases } from "./foundry-types";

/**
 * As bases do personagem aberto, pedidas ao relay na montagem da tela. Daí em
 * diante chegam sozinhas: o cômodo que o mestre construiu, o porte que subiu e
 * a manutenção paga vêm pelo push (ver `obterBases` no módulo).
 */
export function useBases(): EstadoBases | null {
  const { bases, carregarBases } = useFoundry();

  useEffect(() => {
    carregarBases();
    // Só na montagem, como em `useNegocios`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return bases;
}
