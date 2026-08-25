"use client";

import { faCheck, faCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import ModalFormulaPericia from "../components/modal-formula-pericia";
import { useFoundry } from "../lib/foundry-provider";

export default function Page() {
  const { ficha } = useFoundry();
  const [chaveAberta, setChaveAberta] = useState<string | null>(null);

  if (!ficha) return null;

  const pericia = ficha.pericias.find((p) => p.chave === chaveAberta) ?? null;

  return (
    <div className="flex flex-col gap-4 py-6 text-olive-800 dark:text-olive-400">
      <h1 className="text-3xl font-bold">Perícias</h1>

      <ul className="flex flex-col gap-2">
        {ficha.pericias.map((p) => (
          <li key={p.chave}>
            <button
              type="button"
              onClick={() => setChaveAberta(p.chave)}
              className={`flex w-full items-center gap-3 rounded-lg border-2 px-3 py-2 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                p.treinado ? "border-red-900" : "border-red-900/60"
              }`}
            >
              <FontAwesomeIcon icon={p.treinado ? faCheck : faCircle} className={p.treinado ? "size-3.5! opacity-90" : "size-3! opacity-40"} />
              <span className="flex-1">
                {p.label}
                {p.somenteTreinado && (
                  <span className="ml-2 text-xs uppercase tracking-wide opacity-60">Somente treinado</span>
                )}
              </span>
              <span className="font-bold">{p.valorFormatado}</span>
            </button>
          </li>
        ))}
      </ul>

      {chaveAberta && (
        <ModalFormulaPericia formula={pericia?.formula ?? null} onFechar={() => setChaveAberta(null)} />
      )}
    </div>
  );
}
