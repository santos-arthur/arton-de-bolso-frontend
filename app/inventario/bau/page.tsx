"use client";

import Link from "next/link";
import { useMemo } from "react";
import { FaChevronLeft } from "react-icons/fa6";
import CabecalhoPagina from "../../components/cabecalho-pagina";
import ListaInventario, { recortarInventario } from "../../components/lista-inventario";
import PaginaFicha from "../../components/pagina-ficha";
import { useFoundry } from "../../lib/foundry-provider";
import type { GrupoInventario } from "../../lib/foundry-types";

const SEM_INVENTARIO: GrupoInventario[] = [];

/**
 * O que o personagem tem mas não está carregando: mesmos grupos e mesma busca
 * da mochila, sem barra de espaços — o que está guardado não pesa nas costas
 * de ninguém, e por isso o baú não tem limite.
 */
export default function Page() {
  const { ficha } = useFoundry();

  const inventario = ficha?.inventario ?? SEM_INVENTARIO;
  const guardados = useMemo(() => recortarInventario(inventario, false), [inventario]);

  if (!ficha) return null;

  const total = guardados.reduce((soma, grupo) => soma + grupo.itens.length, 0);

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Baú">
        {total} {total === 1 ? "item guardado" : "itens guardados"}
      </CabecalhoPagina>

      <Link
        href="/inventario"
        className="flex w-fit flex-row items-center gap-2 text-sm font-semibold opacity-70 transition-opacity hover:opacity-100"
      >
        <FaChevronLeft aria-hidden="true" className="size-3!" />
        Voltar para a mochila
      </Link>

      {/* Busca sempre à mão: no baú se procura o que foi largado lá meses
          atrás, e esperar dar oito itens para poder buscar não ajuda. */}
      <ListaInventario grupos={guardados} vazio="Nada guardado no baú." buscaSempre />
    </PaginaFicha>
  );
}
