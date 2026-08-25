"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import BarraResumo from "./barra-resumo";
import ModalRecursoFicha from "./modal-recurso-ficha";

const ROTAS_SEM_BARRA = ["/configuracoes"];
const ROTAS_BARRA_COMPACTA = ["/combate"];

export default function BarraResumoCondicional() {
  const pathname = usePathname();
  const [recursoAberto, setRecursoAberto] = useState<"pv" | "pm" | null>(null);

  if (ROTAS_SEM_BARRA.includes(pathname)) return null;

  return (
    <>
      <BarraResumo compacta={ROTAS_BARRA_COMPACTA.includes(pathname)} onAbrirModalRecurso={setRecursoAberto} />
      {recursoAberto && <ModalRecursoFicha recurso={recursoAberto} onFechar={() => setRecursoAberto(null)} />}
    </>
  );
}
