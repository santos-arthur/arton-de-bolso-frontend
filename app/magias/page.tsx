"use client";

import { FaStar, FaWandSparkles } from "react-icons/fa6";
import { useMemo, useState } from "react";
import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import CampoBusca, { ChipFiltro, normalizar } from "../components/campo-busca";
import CartaoExpansivel from "../components/cartao-expansivel";
import ModalMagia from "../components/modal-magia";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";
import type { Magia } from "../lib/foundry-types";

/** Referência estável: `?? []` criaria um array novo a cada render e invalidaria o memo. */
const SEM_MAGIAS: Magia[] = [];

export default function Page() {
  const { ficha, somenteLeitura, alternarPreparada } = useFoundry();
  const [busca, setBusca] = useState("");
  const [conjurando, setConjurando] = useState<Magia | null>(null);
  // Vem repetida em cada magia porque é do conjurador; qualquer uma serve.
  const cd = ficha?.magias?.[0]?.cd ?? null;
  const [circulo, setCirculo] = useState<number | null>(null);
  const [soPreparadas, setSoPreparadas] = useState(false);

  const magias = ficha?.magias ?? SEM_MAGIAS;
  // Conjurador espontâneo (druida, bardo) não prepara magia nenhuma: some o
  // filtro e some a estrela, em vez de mostrar um controle que nunca muda.
  const preparaMagias = magias.some((m) => m.preparavel);
  const preparadas = magias.filter((m) => m.preparavel && m.preparada).length;
  const circulos = useMemo(
    () => [...new Set(magias.map((m) => m.circulo))].sort((a, b) => a - b),
    [magias]
  );

  // Agrupar por círculo é como o livro organiza e como se procura na mesa.
  const porCirculo = useMemo(() => {
    const alvo = normalizar(busca);
    const filtradas = magias.filter(
      (m) =>
        (circulo === null || m.circulo === circulo) &&
        (!soPreparadas || !m.preparavel || m.preparada) &&
        (!alvo || normalizar(`${m.nome} ${m.escola}`).includes(alvo))
    );
    const grupos = new Map<number, typeof filtradas>();
    for (const magia of filtradas) {
      if (!grupos.has(magia.circulo)) grupos.set(magia.circulo, []);
      grupos.get(magia.circulo)!.push(magia);
    }
    return [...grupos.entries()].sort(([a], [b]) => a - b);
  }, [magias, busca, circulo, soPreparadas]);

  if (!ficha) return null;

  const total = porCirculo.reduce((soma, [, lista]) => soma + lista.length, 0);

  return (
    <PaginaFicha>
      {/* A CD vale para todas as magias do personagem, não para cada uma —
          por isso fica no cabeçalho, e não repetida em cada cartão. */}
      <CabecalhoPagina titulo="Magias">
        {cd === null ? "" : `CD ${cd} · `}
        {preparaMagias
          ? `${preparadas} de ${magias.length} preparadas`
          : `${magias.length} ${magias.length === 1 ? "magia" : "magias"}`}
      </CabecalhoPagina>

      {magias.length > 0 && (
        <CampoBusca valor={busca} aoMudar={setBusca} placeholder="Buscar magia...">
          <ChipFiltro ativo={circulo === null} onClick={() => setCirculo(null)}>
            Todos
          </ChipFiltro>
          {circulos.map((c) => (
            <ChipFiltro key={c} ativo={circulo === c} onClick={() => setCirculo(circulo === c ? null : c)}>
              {c}º
            </ChipFiltro>
          ))}
          {preparaMagias && (
            <ChipFiltro ativo={soPreparadas} onClick={() => setSoPreparadas((v) => !v)}>
              Preparadas
            </ChipFiltro>
          )}
        </CampoBusca>
      )}

      {total === 0 ? (
        <EstadoVazio>{magias.length ? "Nenhuma magia encontrada." : "Nenhuma magia nesta ficha."}</EstadoVazio>
      ) : (
        porCirculo.map(([numero, lista]) => (
          <section key={numero} className="flex flex-col gap-2">
            <TituloSecao>{numero}º círculo</TituloSecao>
            <ul className="flex flex-col gap-2">
              {lista.map((magia) => (
                <CartaoExpansivel
                  key={magia.id}
                  nome={magia.nome}
                  img={magia.img}
                  descricao={magia.descricao}
                  destacado={magia.preparavel && magia.preparada}
                  etiquetas={
                    <>
                      {magia.escola && <Tag>{magia.escola}</Tag>}
                      {magia.tipo && <Tag>{magia.tipo}</Tag>}
                      {magia.ativacao && <Tag>{magia.ativacao}</Tag>}
                    </>
                  }
                  acessorio={
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConjurando(magia)}
                        className="flex min-h-9 items-center gap-1.5 rounded-full bg-acento px-3 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                      >
                        <FaWandSparkles aria-hidden="true" className="size-3!" />
                        Conjurar
                      </button>
                      {magia.preparavel &&
                        (somenteLeitura ? (
                          magia.preparada && (
                            <FaStar role="img" title="Preparada" className="size-3.5! text-acento" />
                          )
                        ) : (
                          <button
                            type="button"
                            onClick={() => alternarPreparada(magia.id)}
                            aria-pressed={magia.preparada}
                            title={magia.preparada ? "Preparada" : "Não preparada"}
                            className={`flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-bold transition-colors ${
                              magia.preparada
                                ? "border-acento text-acento"
                                : "border-borda opacity-60 hover:bg-foreground/5"
                            }`}
                          >
                            <FaStar aria-hidden="true" className="size-3!" />
                            {magia.preparada ? "Preparada" : "Preparar"}
                          </button>
                        ))}
                    </div>
                  }
                />
              ))}
            </ul>
          </section>
        ))
      )}
      {conjurando && <ModalMagia magia={conjurando} onFechar={() => setConjurando(null)} />}
    </PaginaFicha>
  );
}
