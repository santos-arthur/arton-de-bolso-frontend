"use client";

import FolhaModal from "./folha-modal";
import LinhaCombatente from "./linha-combatente";
import { useFoundry } from "../lib/foundry-provider";
import type { EstadoCombate } from "../lib/foundry-types";

/**
 * A ordem do combate inteira: quem vem antes, quem vem depois, quanto cada
 * um tirou e como estão os aliados.
 *
 * O turno atual tem borda destacada (ver `LinhaCombatente`) em vez de só um
 * marcador no canto: numa lista de dez linhas lidas de relance na mesa, é a
 * borda que responde "é a minha vez?" sem precisar ler nada.
 */
export default function ModalOrdemCombate({
  combate,
  onFechar
}: {
  combate: EstadoCombate;
  onFechar: () => void;
}) {
  const { ficha } = useFoundry();
  const { rodada, comecou, combatentes } = combate;

  return (
    <FolhaModal titulo={comecou ? `Combate · Rodada ${rodada}` : "Combate"} onFechar={onFechar}>
      {!comecou && (
        <p className="rounded-xl border border-borda bg-superficie-alta px-4 py-2 text-center text-sm opacity-70">
          O combate ainda não começou — dá para rolar a iniciativa desde já.
        </p>
      )}

      {combatentes.length === 0 ? (
        <p className="text-sm opacity-60">Ninguém na ordem de combate ainda.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {combatentes.map((combatente) => (
            <LinhaCombatente
              key={combatente.id}
              combatente={combatente}
              ehFichaAberta={!!ficha && combatente.atorId === ficha.id}
              detalhado
            />
          ))}
        </ul>
      )}
    </FolhaModal>
  );
}
