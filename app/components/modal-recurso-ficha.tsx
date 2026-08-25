"use client";

import ModalRecurso from "./modal-recurso";
import { useFoundry } from "../lib/foundry-provider";

/** Liga o <ModalRecurso> (puramente apresentacional) aos dados/ações reais de PV ou PM vindos do Foundry. */
export default function ModalRecursoFicha({
  recurso,
  onFechar
}: {
  recurso: "pv" | "pm";
  onFechar: () => void;
}) {
  const { ficha, definirAtual, definirTemporario } = useFoundry();
  if (!ficha) return null;

  const dado = ficha[recurso];

  return (
    <ModalRecurso
      rotulo={recurso.toUpperCase()}
      atual={dado.atual ?? 0}
      maximo={dado.max ?? 0}
      itensMaximo={dado.itensMax}
      temporario={dado.temp}
      onFechar={onFechar}
      onAlterarAtual={(novoValor) => definirAtual(recurso, novoValor)}
      onAlterarTemporario={(novoValor) => definirTemporario(recurso, novoValor)}
    />
  );
}
