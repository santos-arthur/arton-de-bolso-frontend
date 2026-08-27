import {
  FaBolt,
  FaBoxOpen,
  FaListCheck,
  FaShieldHalved,
  FaUser,
  FaWandSparkles
} from "react-icons/fa6";
import type { IconType } from "react-icons";

/**
 * Seções *da ficha*. A navegação em si vive no <MenuLateral />.
 * `curto` é o rótulo da barra inferior do celular, onde cada aba tem ~55px.
 */
export const ITENS_NAV: { rotulo: string; curto: string; href: string; icone: IconType }[] = [
  { rotulo: "Detalhes", curto: "Ficha", href: "/detalhes", icone: FaUser },
  { rotulo: "Combate", curto: "Combate", href: "/combate", icone: FaShieldHalved },
  { rotulo: "Perícias", curto: "Perícias", href: "/pericias", icone: FaListCheck },
  { rotulo: "Poderes", curto: "Poderes", href: "/poderes", icone: FaBolt },
  { rotulo: "Inventário", curto: "Mochila", href: "/inventario", icone: FaBoxOpen },
  { rotulo: "Magias", curto: "Magias", href: "/magias", icone: FaWandSparkles }
];

/**
 * A rota está nesta seção? Compara por prefixo para as sub-páginas contarem
 * como parte dela — `/inventario/bau` é o baú da mochila, não uma seção nova:
 * o dock mantém "Mochila" aceso e o cabeçalho da ficha continua na tela.
 */
export function eDaSecao(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Rotas em que o cabeçalho da ficha faz sentido — fora delas (home, configurações) ele some. */
export function eRotaDeFicha(pathname: string) {
  return ITENS_NAV.some((item) => eDaSecao(pathname, item.href));
}
