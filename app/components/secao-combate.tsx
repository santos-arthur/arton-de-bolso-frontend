"use client";

import { useState } from "react";
import { FaDiceD20, FaListUl } from "react-icons/fa6";
import LinhaCombatente from "./linha-combatente";
import ModalIniciativa from "./modal-iniciativa";
import ModalOrdemCombate from "./modal-ordem-combate";
import { TituloSecao } from "./cabecalho-pagina";
import { useCombate } from "../lib/combate";
import { useFoundry } from "../lib/foundry-provider";

/** A perícia que o sistema usa na fórmula de iniciativa. */
const PERICIA_INICIATIVA = "inic";

/**
 * O combate, no topo da aba de Combate — e só enquanto existe um.
 *
 * Fora de luta a seção não aparece: o encontro é do mundo, não da ficha, e
 * uma faixa "sem combate" ocupando a primeira dobra da tela mais atrapalha
 * do que informa.
 *
 * O que fica à vista é o que se pergunta em voz alta na mesa — de quem é a
 * vez, quem vem depois, quanto eu tirei. A lista de quem está na luta mora
 * inteira no modal "Ordem do combate": numa mesa com dez criaturas ela
 * empurraria armas e proteções para fora da tela, e é consulta, não algo
 * que se acompanhe o tempo todo.
 */
export default function SecaoCombate() {
  const { ficha, somenteLeitura } = useFoundry();
  // O hook já pede o combate na montagem — é o que inscreve esta sessão no
  // push das viradas de turno.
  const { combate, ativo, meu, atual, proximo, ehFichaAberta } = useCombate();
  const [abrindoIniciativa, setAbrindoIniciativa] = useState(false);
  const [abrindoOrdem, setAbrindoOrdem] = useState(false);

  if (!combate || !ativo) return null;

  const { rodada, comecou, combatentes } = combate;
  // Posição na ordem: é o que responde "falta muito pra minha vez?" sem
  // abrir a lista inteira.
  const posicao = meu ? combatentes.findIndex((c) => c.id === meu.id) + 1 : 0;
  const formulaIniciativa = ficha?.pericias.find((p) => p.chave === PERICIA_INICIATIVA)?.formula ?? null;

  const botao =
    "flex min-h-11 flex-row items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-colors";

  return (
    <div className="flex flex-col gap-2">
      <TituloSecao>{comecou ? `Combate · Rodada ${rodada}` : "Combate"}</TituloSecao>

      <div className="flex flex-col gap-2 rounded-xl border border-borda bg-superficie-alta px-3 py-3">
        {atual ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Turno de</span>
            {/* A mesma linha do modal, e só ela: com retrato e barra de vida,
                quem está na vez se reconhece de relance — que é o que se
                quer olhar no meio da luta. Os outros ficam na ordem
                completa. As regras de PV/PM são as de lá: aliado com
                números, inimigo só se o mestre liberar, e nada quando é a
                ficha que você já tem aberta. */}
            <ul>
              <LinhaCombatente combatente={atual} ehFichaAberta={ehFichaAberta(atual)} detalhado />
            </ul>
            {proximo && (
              <span className="text-sm opacity-60">
                Próximo: <span className="font-semibold">{proximo.nome}</span>
              </span>
            )}
          </div>
        ) : (
          <p className="text-sm opacity-60">
            {comecou ? "Ninguém com o turno agora." : "O mestre ainda não iniciou o combate."}
          </p>
        )}

        {/* Enquanto não há iniciativa, o d20 é a ação da tela. Depois de
            gravada ela vira informação: o número está no encontro, e mexer
            nele de novo pelo celular só criaria divergência com o que o
            mestre vê no rastreador. */}
        {meu &&
          (meu.iniciativa === null
            ? !somenteLeitura && (
                <button
                  type="button"
                  onClick={() => setAbrindoIniciativa(true)}
                  className={`${botao} w-full bg-acento text-acento-tinta hover:opacity-90`}
                >
                  <FaDiceD20 aria-hidden="true" className="size-4! shrink-0" />
                  Rolar iniciativa
                </button>
              )
            : (
                <div className="flex flex-row items-center justify-between gap-3 rounded-xl border border-borda px-3 py-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider opacity-55">Sua iniciativa</span>
                  <span className="flex flex-row items-baseline gap-2">
                    <span className="numero text-xl font-bold">{meu.iniciativa}</span>
                    <span className="text-xs opacity-60">
                      {meu.ehAtual ? "é a sua vez" : posicao > 0 ? `${posicao}º na ordem` : ""}
                    </span>
                  </span>
                </div>
              ))}

        <button
          type="button"
          onClick={() => setAbrindoOrdem(true)}
          className={`${botao} w-full border border-borda hover:bg-foreground/5`}
        >
          <FaListUl aria-hidden="true" className="size-3.5! shrink-0" />
          Ordem do combate
        </button>
      </div>

      {abrindoIniciativa && (
        <ModalIniciativa formula={formulaIniciativa} onFechar={() => setAbrindoIniciativa(false)} />
      )}
      {abrindoOrdem && <ModalOrdemCombate combate={combate} onFechar={() => setAbrindoOrdem(false)} />}
    </div>
  );
}
