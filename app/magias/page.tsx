"use client";

import { faStar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import CabecalhoPagina, { EstadoVazio } from "../components/cabecalho-pagina";
import PaginaFicha from "../components/pagina-ficha";
import Tag from "../components/tag";
import { useFoundry } from "../lib/foundry-provider";

export default function Page() {
  const { ficha } = useFoundry();
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  if (!ficha) return null;

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Magias">
        <span className="text-sm opacity-70">{ficha.magias.length}</span>
      </CabecalhoPagina>

      {ficha.magias.length === 0 && <EstadoVazio>Nenhuma magia nesta ficha.</EstadoVazio>}

      <ul className="flex flex-col gap-2">
        {ficha.magias.map((magia) => {
          const expandido = expandidoId === magia.id;
          return (
            <li key={magia.id} className="rounded-lg border-2 border-red-900 px-3 py-2">
              <div className="flex items-center gap-3">
                {magia.img && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={magia.img} alt="" className="size-8 rounded-md object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setExpandidoId(expandido ? null : magia.id)}
                  className="flex-1 text-left font-bold"
                >
                  {magia.nome}
                </button>
                {magia.preparada && (
                  <FontAwesomeIcon icon={faStar} title="Preparada" className="size-3.5! text-red-900" />
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Tag>{magia.circulo}º círculo</Tag>
                {magia.escola && <Tag>{magia.escola}</Tag>}
                {magia.tipo && <Tag>{magia.tipo}</Tag>}
                {magia.ativacao && <Tag>{magia.ativacao}</Tag>}
              </div>
              {expandido && magia.descricao && (
                <div
                  className="mt-2 border-t border-red-900/40 pt-2 text-sm [&_p]:mb-2 last:[&_p]:mb-0"
                  dangerouslySetInnerHTML={{ __html: magia.descricao }}
                />
              )}
            </li>
          );
        })}
      </ul>
    </PaginaFicha>
  );
}
