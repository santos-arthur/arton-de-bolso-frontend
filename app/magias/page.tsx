"use client";

import { FaStar } from "react-icons/fa6";
import { useMemo, useState } from "react";
import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import CampoBusca, { ChipFiltro, normalizar } from "../components/campo-busca";
import CartaoExpansivel from "../components/cartao-expansivel";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";
import type { Magia } from "../lib/foundry-types";

/** Referência estável: `?? []` criaria um array novo a cada render e invalidaria o memo. */
const SEM_MAGIAS: Magia[] = [];

export default function Page() {
  const { ficha } = useFoundry();
  const [busca, setBusca] = useState("");
  const [circulo, setCirculo] = useState<number | null>(null);
  const [soPreparadas, setSoPreparadas] = useState(false);

  const magias = ficha?.magias ?? SEM_MAGIAS;
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
        (!soPreparadas || m.preparada) &&
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
      <CabecalhoPagina titulo="Magias">{magias.length}</CabecalhoPagina>

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
          <ChipFiltro ativo={soPreparadas} onClick={() => setSoPreparadas((v) => !v)}>
            Preparadas
          </ChipFiltro>
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
                  destacado={magia.preparada}
                  etiquetas={
                    <>
                      {magia.escola && <Tag>{magia.escola}</Tag>}
                      {magia.tipo && <Tag>{magia.tipo}</Tag>}
                      {magia.ativacao && <Tag>{magia.ativacao}</Tag>}
                    </>
                  }
                  acessorio={
                    magia.preparada ? (
                      <FaStar role="img" title="Preparada" className="size-3.5! shrink-0 text-acento" />
                    ) : undefined
                  }
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </PaginaFicha>
  );
}
