"use client";

import { FaChevronRight, FaEye, FaPlus, FaSpinner } from "react-icons/fa6";
import Link from "next/link";
import { useMemo, useState } from "react";
import CabecalhoPagina, { EstadoVazio } from "../components/cabecalho-pagina";
import CampoBusca, { ChipFiltro, normalizar } from "../components/campo-busca";
import { meuDiario, resumir, useDiarios } from "../lib/anotacoes";

/** A partir daqui a busca aparece — abaixo disso a lista inteira cabe na tela. */
const BUSCA_A_PARTIR_DE = 6;

/**
 * Anotações: o diário do jogador e os dos colegas, um por aba.
 *
 * Não é uma seção da ficha — é do *usuário*, e continua fazendo sentido sem
 * personagem nenhum aberto. Por isso mora fora do menu de seções, junto de
 * Início e Configurações.
 */
export default function Page() {
  const { diarios, carregando } = useDiarios();
  const [escolhido, setEscolhido] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const meu = meuDiario(diarios);
  // Enquanto o jogador não escolher nada, o diário aberto é o dele — é o que
  // ele vem fazer aqui na maioria das vezes.
  const diario = diarios.find((d) => d.id === escolhido) ?? meu ?? diarios[0] ?? null;

  const paginas = useMemo(() => {
    const alvo = normalizar(busca);
    const todas = diario?.paginas ?? [];
    if (!alvo) return todas;
    return todas.filter((pagina) => normalizar(`${pagina.titulo} ${pagina.texto}`).includes(alvo));
  }, [diario, busca]);

  if (carregando) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
        <FaSpinner aria-hidden="true" className="size-5! animate-spin opacity-60" />
        <p className="text-sm opacity-60">Carregando anotações...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina titulo="Anotações">
        {diario ? `${diario.paginas.length} ${diario.paginas.length === 1 ? "anotação" : "anotações"}` : null}
      </CabecalhoPagina>

      {diarios.length === 0 ? (
        <EstadoVazio>
          Nenhum diário encontrado. O mestre precisa estar com o Foundry aberto para o app criar o seu.
        </EstadoVazio>
      ) : (
        <>
          {/* Uma aba por jogador. Com um diário só (mesa de um jogador, ou
              permissões fechadas pelo mestre) não há o que escolher. */}
          {diarios.length > 1 && (
            <div className="flex flex-row flex-wrap gap-1.5">
              {diarios.map((d) => (
                <ChipFiltro key={d.id} ativo={d.id === diario?.id} onClick={() => setEscolhido(d.id)}>
                  {d.meu ? "Minhas" : d.nome}
                </ChipFiltro>
              ))}
            </div>
          )}

          {diario?.meu ? (
            <Link
              href="/anotacoes/nova"
              className="flex min-h-11 w-fit flex-row items-center gap-2 rounded-xl bg-acento px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
            >
              <FaPlus aria-hidden="true" className="size-3.5!" />
              Nova anotação
            </Link>
          ) : (
            <p className="flex flex-row items-center gap-2 text-sm opacity-60">
              <FaEye aria-hidden="true" className="size-3.5!" />
              Diário de {diario?.nome} — você pode ler, mas não editar.
            </p>
          )}

          {(diario?.paginas.length ?? 0) >= BUSCA_A_PARTIR_DE && (
            <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar anotação..." />
          )}

          {paginas.length === 0 ? (
            <EstadoVazio>
              {diario?.paginas.length
                ? "Nenhuma anotação encontrada."
                : diario?.meu
                  ? "Você ainda não escreveu nada. Comece pela primeira anotação."
                  : "Este diário ainda está vazio."}
            </EstadoVazio>
          ) : (
            <ul className="flex flex-col gap-2">
              {paginas.map((pagina) => (
                <li key={pagina.id}>
                  <Link
                    href={`/anotacoes/${pagina.id}`}
                    className="flex flex-row items-center gap-3 rounded-2xl border border-borda bg-superficie-alta px-4 py-3 transition-colors hover:bg-foreground/5"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-display text-base font-bold">{pagina.titulo}</span>
                      {pagina.texto && (
                        <span className="line-clamp-2 text-xs opacity-60">{resumir(pagina.texto)}</span>
                      )}
                    </span>
                    <FaChevronRight aria-hidden="true" className="size-3! shrink-0 opacity-40" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
