"use client";

import { FaCircleCheck } from "react-icons/fa6";
import { useMemo, useState } from "react";
import CabecalhoPagina, { EstadoVazio } from "../components/cabecalho-pagina";
import CampoBusca, { ChipFiltro, normalizar } from "../components/campo-busca";
import ModalFormulaPericia from "../components/modal-formula-pericia";
import PaginaFicha from "../components/pagina-ficha";
import { useFoundry } from "../lib/foundry-provider";
import type { Pericia } from "../lib/foundry-types";

/** Referência estável: `?? []` criaria um array novo a cada render e invalidaria o memo. */
const SEM_PERICIAS: Pericia[] = [];

type Filtro = "todas" | "treinadas" | "disponiveis";

/**
 * "Disponíveis" é o filtro do jogo: mostra o que o personagem pode de fato
 * testar agora — as treinadas mais as que qualquer um pode tentar. Fora dele
 * ficam só as perícias marcadas "apenas treinado" em que ele não tem treino.
 */
const FILTROS: Record<Filtro, { rotulo: string; aceita: (p: Pericia) => boolean }> = {
  todas: { rotulo: "Todas", aceita: () => true },
  treinadas: { rotulo: "Treinadas", aceita: (p) => p.treinado },
  disponiveis: { rotulo: "Disponíveis", aceita: (p) => p.treinado || !p.somenteTreinado }
};

export default function Page() {
  const { ficha } = useFoundry();
  const [chaveAberta, setChaveAberta] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const pericias = ficha?.pericias ?? SEM_PERICIAS;
  const filtradas = useMemo(() => {
    const alvo = normalizar(busca);
    return pericias.filter(
      (p) => FILTROS[filtro].aceita(p) && (!alvo || normalizar(p.label).includes(alvo))
    );
  }, [pericias, busca, filtro]);

  if (!ficha) return null;

  const treinadas = pericias.filter((p) => p.treinado).length;
  const aberta = pericias.find((p) => p.chave === chaveAberta) ?? null;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Perícias">
        {treinadas} de {pericias.length} treinadas
      </CabecalhoPagina>

      <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar perícia...">
        {(Object.keys(FILTROS) as Filtro[]).map((chave) => (
          <ChipFiltro key={chave} ativo={filtro === chave} onClick={() => setFiltro(chave)}>
            {FILTROS[chave].rotulo}
          </ChipFiltro>
        ))}
      </CampoBusca>

      {filtradas.length === 0 ? (
        <EstadoVazio>Nenhuma perícia encontrada.</EstadoVazio>
      ) : (
        // Duas colunas a partir do tablet: são 20+ linhas curtas, e uma coluna
        // só desperdiça metade da largura numa tela grande.
        <ul className="grid grid-cols-1 gap-1.5 md:grid-cols-2 md:gap-2">
          {filtradas.map((p) => (
            <li key={p.chave}>
              <button
                type="button"
                onClick={() => setChaveAberta(p.chave)}
                className="flex min-h-12 w-full flex-row items-center gap-3 rounded-xl border border-borda bg-superficie-alta px-3 py-2 text-left transition-colors hover:border-acento/60 hover:bg-foreground/[0.03]"
              >
                <FaCircleCheck
                  role="img"
                  title={p.treinado ? "Treinada" : "Não treinada"}
                  className={`size-3.5! shrink-0 ${p.treinado ? "text-acento" : "opacity-20"}`}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {p.label}
                  {p.somenteTreinado && !p.treinado && (
                    <span className="ml-2 text-[10px] uppercase tracking-wider opacity-50">só treinado</span>
                  )}
                </span>
                <span className="numero shrink-0 text-base font-bold">{p.valorFormatado}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {chaveAberta && (
        <ModalFormulaPericia formula={aberta?.formula ?? null} onFechar={() => setChaveAberta(null)} />
      )}
    </PaginaFicha>
  );
}
