import {
  FaBolt,
  FaHouseChimney,
  FaListCheck,
  FaShieldHalved,
  FaStore,
  FaUser,
  FaWandSparkles
} from "react-icons/fa6";
import { BsFillBackpackFill } from "react-icons/bs";
import type { IconType } from "react-icons";
import type { Ficha } from "../lib/foundry-types";

/**
 * Seções *da ficha*. A navegação em si vive no <MenuLateral />.
 * `curto` é o rótulo da barra inferior do celular, onde cada aba tem ~55px.
 */
export const ITENS_NAV: { rotulo: string; curto: string; href: string; icone: IconType }[] = [
  { rotulo: "Detalhes", curto: "Ficha", href: "/detalhes", icone: FaUser },
  { rotulo: "Combate", curto: "Combate", href: "/combate", icone: FaShieldHalved },
  { rotulo: "Perícias", curto: "Perícias", href: "/pericias", icone: FaListCheck },
  { rotulo: "Poderes", curto: "Poderes", href: "/poderes", icone: FaBolt },
  { rotulo: "Inventário", curto: "Mochila", href: "/inventario", icone: BsFillBackpackFill },
  { rotulo: "Magias", curto: "Magias", href: "/magias", icone: FaWandSparkles }
];

/**
 * As seções que valem para *esta* ficha.
 *
 * Magias some de quem não conjura: num guerreiro a aba levava a uma tela que
 * só sabia dizer "nenhuma magia nesta ficha", e no celular ela ainda ocupava
 * um sétimo da barra de baixo. Some da barra e do rail; a rota continua de pé
 * (quem já estiver nela não é expulso) e `eRotaDeFicha` continua reconhecendo
 * `/magias` como parte da ficha, para o cabeçalho do personagem não sumir.
 */
export function secoesDaFicha(ficha: Ficha | null) {
  if (!ficha) return [];
  return ITENS_NAV.filter((item) => item.href !== "/magias" || ficha.magias.length > 0);
}

/**
 * A rota está nesta seção? Compara por prefixo para as sub-páginas contarem
 * como parte dela — `/inventario/bau` é o baú da mochila, não uma seção nova:
 * o dock mantém "Mochila" aceso e o cabeçalho da ficha continua na tela.
 */
export function eDaSecao(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Telas que dependem de um módulo irmão (t20-bases, t20-negocios; depois
 * domínios). São da ficha — mostram o que pertence ao personagem aberto —,
 * mas ficam fora da barra de baixo do celular, que já está no limite com as
 * seis seções: no celular moram no painel do Menu; no rail, logo abaixo das
 * seções.
 */
export const ITENS_DE_MODULO: {
  rotulo: string;
  href: string;
  icone: IconType;
  modulo: keyof NonNullable<Ficha["modulos"]>;
}[] = [
  { rotulo: "Bases", href: "/bases", icone: FaHouseChimney, modulo: "bases" },
  { rotulo: "Negócios", href: "/negocios", icone: FaStore, modulo: "negocios" }
];

/** As telas de módulo liberadas para esta ficha — só as dos módulos ativos no mundo. */
export function modulosDaFicha(ficha: Ficha | null) {
  if (!ficha?.modulos) return [];
  return ITENS_DE_MODULO.filter((item) => ficha.modulos?.[item.modulo]);
}

/** Rotas em que o cabeçalho da ficha faz sentido — fora delas (home, configurações) ele some. */
export function eRotaDeFicha(pathname: string) {
  return [...ITENS_NAV, ...ITENS_DE_MODULO].some((item) => eDaSecao(pathname, item.href));
}
