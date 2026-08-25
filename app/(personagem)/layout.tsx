import type { ReactNode } from "react";
import BarraResumo from "../components/barra-resumo";

export default function LayoutPersonagem({ children }: { children: ReactNode }) {
  return (
    <>
      <BarraResumo />
      {children}
    </>
  );
}
