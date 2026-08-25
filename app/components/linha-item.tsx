"use client";

import { faChevronDown, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import type { ItemInventario } from "../lib/foundry-types";

/**
 * Uma linha de item da mochila: nome, quantidade, descrição expansível e o
 * botão de equipar. Vive fora do Inventário porque o Combate mostra as armas
 * equipadas com exatamente o mesmo desenho.
 */
export default function LinhaItem({
  item,
  somenteLeitura,
  aoAlternarEquipado
}: {
  item: ItemInventario;
  somenteLeitura: boolean;
  aoAlternarEquipado: () => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const temDescricao = !!item.descricao;

  return (
    <li
      className={`rounded-lg border-2 px-3 py-2 transition-colors ${
        item.equipado ? "border-red-900 bg-red-900/5 dark:bg-red-900/15" : "border-red-900/60"
      }`}
    >
      <div className="flex flex-row items-center gap-3">
        {item.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.img} alt="" className="size-8 shrink-0 rounded-md object-cover" />
        )}

        <button
          type="button"
          onClick={() => temDescricao && setExpandido((valor) => !valor)}
          disabled={!temDescricao}
          aria-expanded={temDescricao ? expandido : undefined}
          className="flex min-w-0 flex-1 flex-row items-center gap-2 text-left font-bold disabled:cursor-default"
        >
          <span className="truncate">{item.nome}</span>
          {item.quantidade > 1 && <span className="shrink-0 text-sm font-normal opacity-60">×{item.quantidade}</span>}
          {temDescricao && (
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`size-3! shrink-0 opacity-50 transition-transform ${expandido ? "rotate-180" : ""}`}
            />
          )}
        </button>

        {item.equipavel &&
          (somenteLeitura ? (
            item.equipado && (
              <span className="flex shrink-0 items-center gap-1.5 rounded-full border-2 border-red-900 px-2.5 py-0.5 text-xs font-semibold">
                <FontAwesomeIcon icon={faShieldHalved} className="size-3!" />
                Equipado
              </span>
            )
          ) : (
            <button
              type="button"
              onClick={aoAlternarEquipado}
              aria-pressed={item.equipado}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 border-red-900 px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                item.equipado ? "bg-red-900 text-olive-50" : "hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <FontAwesomeIcon icon={faShieldHalved} className="size-3!" />
              {item.equipado ? "Equipado" : "Equipar"}
            </button>
          ))}
      </div>

      {expandido && temDescricao && (
        <div
          className="mt-2 border-t border-red-900/40 pt-2 text-sm [&_p]:mb-2 last:[&_p]:mb-0"
          dangerouslySetInnerHTML={{ __html: item.descricao }}
        />
      )}
    </li>
  );
}
