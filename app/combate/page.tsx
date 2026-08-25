"use client";

import CabecalhoPagina, { EstadoVazio, TituloSecao } from "../components/cabecalho-pagina";
import LinhaItem from "../components/linha-item";
import PaginaFicha from "../components/pagina-ficha";
import { useFoundry } from "../lib/foundry-provider";

/**
 * PV, PM, Defesa e os recursos genéricos moram na <BarraResumo />, visível em
 * todas as abas — repeti-los aqui só duplicaria o mesmo número na tela. O que
 * esta aba acrescenta é o que muda de mão durante a luta: o que está equipado
 * agora. Nada é rolado aqui: os dados são jogados na mesa (ver
 * docs/arquitetura.md).
 */
export default function Page() {
  const { ficha, somenteLeitura, alternarEquipado } = useFoundry();

  if (!ficha) return null;

  const armas = ficha.inventario.find((grupo) => grupo.tipo === "arma")?.itens ?? [];
  const equipadas = armas.filter((arma) => arma.equipado);
  const guardadas = armas.filter((arma) => !arma.equipado);

  return (
    <PaginaFicha>
      <CabecalhoPagina titulo="Combate">
        <span className="text-sm opacity-70">Defesa {ficha.defesa.total ?? "—"}</span>
      </CabecalhoPagina>

      <TituloSecao>Em punho</TituloSecao>
      {equipadas.length === 0 ? (
        <EstadoVazio>Nenhuma arma equipada.</EstadoVazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {equipadas.map((arma) => (
            <LinhaItem
              key={arma.id}
              item={arma}
              somenteLeitura={somenteLeitura}
              aoAlternarEquipado={() => alternarEquipado(arma.id)}
            />
          ))}
        </ul>
      )}

      {guardadas.length > 0 && (
        <>
          <hr className="my-2 border border-red-900" />
          <TituloSecao>Guardadas</TituloSecao>
          <ul className="flex flex-col gap-2">
            {guardadas.map((arma) => (
              <LinhaItem
                key={arma.id}
                item={arma}
                somenteLeitura={somenteLeitura}
                aoAlternarEquipado={() => alternarEquipado(arma.id)}
              />
            ))}
          </ul>
        </>
      )}
    </PaginaFicha>
  );
}
