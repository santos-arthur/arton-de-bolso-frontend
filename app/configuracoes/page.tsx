"use client";

import CabecalhoPagina, { TituloSecao } from "../components/cabecalho-pagina";
import { ThemeSwitcher } from "../components/theme-switcher";

// "Sair" mora na barra principal, junto com a navegação entre telas.
export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <CabecalhoPagina titulo="Configurações" />
      <div className="flex flex-col gap-2">
        <TituloSecao>Tema</TituloSecao>
        <ThemeSwitcher />
      </div>
    </div>
  );
}
