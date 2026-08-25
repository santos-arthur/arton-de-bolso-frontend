"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import BarraResumo from "./barra-resumo";
import ModalRecursoFicha from "./modal-recurso-ficha";
import { eRotaDeFicha } from "./navegacao";

export default function BarraResumoCondicional() {
  const pathname = usePathname();
  const [recursoAberto, setRecursoAberto] = useState<"pv" | "pm" | null>(null);

  // A barra é o cabeçalho da ficha: home e configurações não têm ficha
  // nenhuma em foco, então ela não aparece lá.
  if (!eRotaDeFicha(pathname)) return null;

  return (
    <>
      <BarraResumo onAbrirModalRecurso={setRecursoAberto} />
      {recursoAberto && <ModalRecursoFicha recurso={recursoAberto} onFechar={() => setRecursoAberto(null)} />}
    </>
  );
}
