import {
  faBolt,
  faBoxOpen,
  faListCheck,
  faShieldHalved,
  faUser,
  faWandSparkles
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/**
 * Seções *da ficha*. A navegação em si vive no <MenuLateral />.
 * `curto` é o rótulo da barra inferior do celular, onde cada aba tem ~55px.
 */
export const ITENS_NAV: { rotulo: string; curto: string; href: string; icone: IconDefinition }[] = [
  { rotulo: "Detalhes", curto: "Ficha", href: "/detalhes", icone: faUser },
  { rotulo: "Combate", curto: "Combate", href: "/combate", icone: faShieldHalved },
  { rotulo: "Perícias", curto: "Perícias", href: "/pericias", icone: faListCheck },
  { rotulo: "Poderes", curto: "Poderes", href: "/poderes", icone: faBolt },
  { rotulo: "Inventário", curto: "Mochila", href: "/inventario", icone: faBoxOpen },
  { rotulo: "Magias", curto: "Magias", href: "/magias", icone: faWandSparkles }
];

/** Rotas em que o cabeçalho da ficha faz sentido — fora delas (home, configurações) ele some. */
export function eRotaDeFicha(pathname: string) {
  return ITENS_NAV.some((item) => item.href === pathname);
}
