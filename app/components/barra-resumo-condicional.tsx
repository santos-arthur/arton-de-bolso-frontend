"use client";

import { usePathname } from "next/navigation";
import BarraResumo from "./barra-resumo";

const ROTAS_SEM_BARRA = ["/configuracoes"];
const ROTAS_BARRA_COMPACTA = ["/combate"];

export default function BarraResumoCondicional() {
  const pathname = usePathname();

  if (ROTAS_SEM_BARRA.includes(pathname)) return null;

  return <BarraResumo compacta={ROTAS_BARRA_COMPACTA.includes(pathname)} />;
}
