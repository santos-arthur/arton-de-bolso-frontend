"use client";

import { faBed, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import SelectPersonalizado from "./select-personalizado";

type Qualidade = "Ruim" | "Normal" | "Confortável" | "Luxuoso";

const QUALIDADES: Qualidade[] = ["Ruim", "Normal", "Confortável", "Luxuoso"];

type DadosDescanso = {
  qualidade: Qualidade;
  pvExtraPorNivel: number;
  pmExtraPorNivel: number;
  cuidadosProlongados: boolean;
  acompanhamentoMedico: boolean;
};

const DADOS_INICIAIS: DadosDescanso = {
  qualidade: "Normal",
  pvExtraPorNivel: 0,
  pmExtraPorNivel: 0,
  cuidadosProlongados: false,
  acompanhamentoMedico: false,
};

function ModalDescanso({ onFechar }: { onFechar: () => void }) {
  const [dados, setDados] = useState<DadosDescanso>(DADOS_INICIAIS);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onFechar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-descanso"
        onClick={(evento) => evento.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-xl border-2 border-red-900 bg-olive-300 p-6 text-olive-800 shadow-xl dark:bg-olive-900 dark:text-olive-400"
      >
        <div className="flex flex-row items-center justify-between">
          <h2 id="titulo-modal-descanso" className="text-2xl font-bold">
            Descansar
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <FontAwesomeIcon icon={faXmark} className="size-5!" />
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide opacity-70">
            Qualidade
          </span>
          <SelectPersonalizado
            valor={dados.qualidade}
            opcoes={QUALIDADES}
            aoMudar={(qualidade) => setDados((atual) => ({ ...atual, qualidade }))}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide opacity-70">
            PV Extra Por Nível
          </span>
          <input
            type="number"
            step={1}
            value={dados.pvExtraPorNivel}
            onChange={(evento) =>
              setDados((atual) => ({
                ...atual,
                pvExtraPorNivel: Number(evento.target.value),
              }))
            }
            className="rounded-lg border-2 border-red-900 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold uppercase tracking-wide opacity-70">
            PM Extra Por Nível
          </span>
          <input
            type="number"
            step={1}
            value={dados.pmExtraPorNivel}
            onChange={(evento) =>
              setDados((atual) => ({
                ...atual,
                pmExtraPorNivel: Number(evento.target.value),
              }))
            }
            className="rounded-lg border-2 border-red-900 bg-transparent px-3 py-2"
          />
        </label>

        <label className="flex flex-row items-center gap-2">
          <input
            type="checkbox"
            checked={dados.cuidadosProlongados}
            onChange={(evento) =>
              setDados((atual) => ({
                ...atual,
                cuidadosProlongados: evento.target.checked,
              }))
            }
            className="size-5 shrink-0 cursor-pointer rounded border-2 border-red-900 checkbox-personalizado"
          />
          <span className="font-semibold">Cuidados Prolongados</span>
        </label>

        <label className="flex flex-row items-center gap-2">
          <input
            type="checkbox"
            checked={dados.acompanhamentoMedico}
            onChange={(evento) =>
              setDados((atual) => ({
                ...atual,
                acompanhamentoMedico: evento.target.checked,
              }))
            }
            className="size-5 shrink-0 cursor-pointer rounded border-2 border-red-900 checkbox-personalizado"
          />
          <span className="font-semibold">Acompanhamento Médico</span>
        </label>

        <div className="flex flex-row justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border-2 border-red-900 px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-full border-2 border-red-900 bg-red-900 px-4 py-2 text-sm font-semibold text-olive-50 transition-opacity hover:opacity-90"
          >
            Descansar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BotaoDescanso() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        title="Descansar"
        onClick={() => setAberto(true)}
        className="flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-red-900 p-2 text-sm font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
      >
        <FontAwesomeIcon icon={faBed} className="size-5!" />
      </button>

      {aberto && <ModalDescanso onFechar={() => setAberto(false)} />}
    </>
  );
}
