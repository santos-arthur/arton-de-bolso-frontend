"use client";

/**
 * Rótulos das mudanças de um efeito, escritos para a tela do jogador.
 *
 * O que um Active Effect altera é um caminho de dados
 * (`system.modificadores.dano.cac`). O módulo já resolve a maioria pelo nome
 * que o **próprio sistema** dá ao campo — o `label` do schema —, mas esses
 * nomes foram escritos para a janela de configuração do Foundry, não para uma
 * linha de celular: "Efeitos: Modificador de Jogadas de Dano Corpo a Corpo" é
 * o mesmo que aqui se lê como "Dano corpo a corpo".
 *
 * A tabela abaixo veio de duas varreduras do sistema (`tormenta20.mjs`): o
 * schema de personagem e a lista de **presets** que o próprio editor de
 * efeitos do Foundry oferece ao mestre — que é exatamente o conjunto de
 * caminhos que um efeito de mesa costuma usar, incluindo os que não estão no
 * schema (`system.attributes.pm.bonus.total` e afins, criados em tempo de
 * execução para personagens).
 * O que aparecer fora dela — campo de outro módulo, coisa nova do sistema —
 * cai no nome do sistema e, na falta dele, no caminho cru: feio, mas é
 * exatamente o texto que se copia para cá e ganha um nome.
 *
 * Isto é só apresentação: no Foundry o efeito continua igual, e nada aqui
 * muda ficha, regra ou o que o mestre vê.
 */
const ROTULOS: Record<string, string> = {
  // --- Pontos de vida e de mana ---
  "system.attributes.pv.value": "PV atuais",
  "system.attributes.pv.temp": "PV temporários",
  "system.attributes.pv.max": "PV máximos",
  "system.attributes.pv.min": "PV mínimos",
  "system.attributes.pm.value": "PM atuais",
  "system.attributes.pm.temp": "PM temporários",
  "system.attributes.pm.max": "PM máximos",
  "system.attributes.pm.min": "PM mínimos",
  // Os quatro campos por onde um efeito soma PV/PM: fixo, por nível, e só nos
  // níveis pares ou ímpares (é assim que o sistema modela "+1 PM por nível").
  "system.attributes.pv.bonus.total": "Bônus de PV",
  "system.attributes.pv.bonus.nivel": "Bônus de PV por nível",
  "system.attributes.pv.bonus.nivelPar": "Bônus de PV por nível par",
  "system.attributes.pv.bonus.nivelImpar": "Bônus de PV por nível ímpar",
  "system.attributes.pm.bonus.total": "Bônus de PM",
  "system.attributes.pm.bonus.nivel": "Bônus de PM por nível",
  "system.attributes.pm.bonus.nivelPar": "Bônus de PM por nível par",
  "system.attributes.pm.bonus.nivelImpar": "Bônus de PM por nível ímpar",

  // --- Defesa ---
  "system.attributes.defesa.value": "Defesa",
  "system.attributes.defesa.base": "Defesa base",
  "system.attributes.defesa.outros": "Defesa",
  "system.attributes.defesa.bonus": "Defesa",
  "system.attributes.defesa.condi": "Defesa por condição",
  "system.attributes.defesa.atributo": "Atributo da Defesa",

  // --- Deslocamento (os nomes do sistema são "MovementWalk" e afins) ---
  "system.attributes.movement.walk.base": "Deslocamento",
  "system.attributes.movement.walk.bonus": "Deslocamento",
  "system.attributes.movement.climb.base": "Escalada",
  "system.attributes.movement.climb.bonus": "Escalada",
  "system.attributes.movement.swim.base": "Natação",
  "system.attributes.movement.swim.bonus": "Natação",
  "system.attributes.movement.fly.base": "Voo",
  "system.attributes.movement.fly.bonus": "Voo",
  "system.attributes.movement.burrow.base": "Escavação",
  "system.attributes.movement.burrow.bonus": "Escavação",
  "system.attributes.movement.hover": "Pairar",

  // --- Outros números da ficha ---
  "system.attributes.cd": "CD",
  "system.attributes.treino": "Bônus de treino",
  "system.attributes.conjuracao": "Atributo de conjuração",
  "system.attributes.nivel.value": "Nível",
  "system.attributes.carga.value": "Carga",
  "system.attributes.carga.base": "Carga base",
  "system.attributes.carga.bonus": "Carga",
  "system.attributes.carga.max": "Carga máxima",

  // --- Modificadores: testes de atributo ---
  "system.modificadores.atributos.geral": "Testes de atributo",
  "system.modificadores.atributos.fisicos": "Testes de atributos físicos",
  "system.modificadores.atributos.mentais": "Testes de atributos mentais",
  "system.modificadores.atributos.for": "Testes de Força",
  "system.modificadores.atributos.des": "Testes de Destreza",
  "system.modificadores.atributos.con": "Testes de Constituição",
  "system.modificadores.atributos.int": "Testes de Inteligência",
  "system.modificadores.atributos.sab": "Testes de Sabedoria",
  "system.modificadores.atributos.car": "Testes de Carisma",

  // --- Modificadores: ataque ---
  // Os três compartilham o mesmo label errado no sistema ("Jogadas de Dano A
  // Distância"), o que torna esta tabela a única fonte correta para eles.
  "system.modificadores.ataque.geral": "Ataque",
  "system.modificadores.ataque.cac": "Ataque corpo a corpo",
  "system.modificadores.ataque.ad": "Ataque à distância",

  // --- Modificadores: dano e cura ---
  "system.modificadores.dano.geral": "Dano",
  "system.modificadores.dano.cac": "Dano corpo a corpo",
  "system.modificadores.dano.ad": "Dano à distância",
  "system.modificadores.dano.mag": "Dano de magia",
  "system.modificadores.dano.alq": "Dano de alquimia",
  "system.modificadores.cura.geral": "Cura",
  "system.modificadores.cura.mag": "Cura de magia",
  "system.modificadores.cura.alq": "Cura alquímica",

  // --- Modificadores: perícias ---
  "system.modificadores.pericias.geral": "Testes de perícia",
  "system.modificadores.pericias.ataque": "Testes de ataque",
  "system.modificadores.pericias.resistencia": "Testes de resistência",
  "system.modificadores.pericias.semataque": "Perícias (exceto ataque)",
  "system.modificadores.pericias.atr.for": "Perícias de Força",
  "system.modificadores.pericias.atr.des": "Perícias de Destreza",
  "system.modificadores.pericias.atr.con": "Perícias de Constituição",
  "system.modificadores.pericias.atr.int": "Perícias de Inteligência",
  "system.modificadores.pericias.atr.sab": "Perícias de Sabedoria",
  "system.modificadores.pericias.atr.car": "Perícias de Carisma",

  // --- Custo de magias e habilidades ---
  "system.modificadores.custoPM": "Custo em PM",

  // --- Dinheiro (os nomes de campo não seguem a sigla do metal: ver README do módulo) ---
  "system.dinheiro.tc": "Moedas de cobre",
  "system.dinheiro.tl": "Moedas de platina",
  "system.dinheiro.to": "Moedas de ouro",
  "system.dinheiro.tp": "Moedas de prata",

  // --- Caminhos que o sistema declara mas não traduz no pt-BR (o label fica
  //     "T20.SensesList" e afins, então aqui é a única fonte de nome) ---
  "system.attributes.sentidos.value": "Sentidos",
  "system.attributes.sentidos.custom": "Sentidos (personalizados)",
  "system.attributes.carga.limit": "Limite de carga",
  "system.resistencias.base": "Redução de dano base",
  "system.resistencias.bonus": "Redução de dano",
  "system.resistencias.excecao": "Exceção da redução de dano",
  // Resistência por tipo de dano ("...resistencias.fogo.bonus") não entra
  // aqui: são treze tipos vezes cinco partes, e o módulo monta o nome a partir
  // do `damageTypes` do sistema.

  // --- Limites de equipamento ---
  "system.equipamentos.limiteEmpunhado": "Limite de itens empunhados",
  "system.equipamentos.limiteVestido": "Limite de itens vestidos",

  // --- Listas da ficha ---
  "system.traits.tamanho": "Tamanho",
  // Grafia antiga do mesmo campo, que o editor de efeitos do sistema ainda oferece.
  "system.tracos.tamanho": "Tamanho",
  "system.traits.ic.value": "Imunidade a condições",
  "system.tracos.ic.value": "Imunidade a condições",
  "system.traits.idiomas.value": "Idiomas",
  "system.traits.profArmas.value": "Proficiência com armas",
  "system.traits.profArmaduras.value": "Proficiência com armaduras"
};

/**
 * Cerimônia que os labels do sistema carregam por serem escritos para a janela
 * de configuração de efeitos: lá, dentro daquele contexto, "Efeitos:
 * Modificador de ..." e "... por Efeitos Aplicados" fazem sentido; numa linha
 * de ficha que já está debaixo do título "Efeitos", é repetição.
 *
 * Vale para todo caminho que não estiver na tabela acima, inclusive os que o
 * sistema ainda vai criar — que é o ponto de podar em vez de listar.
 */
const PODAS: RegExp[] = [
  /^efeitos:\s*/i,
  // A preposição é opcional porque o sistema escreve das duas formas
  // ("Modificador de Custo de PM", "Modificador Testes de Resistência").
  /^modificador\s+(?:de|do|da|dos|das)?\s*/i,
  /^valor\s+(?:base|bônus|bonus)\s+(?:de|do|da)\s+/i,
  /^valor\s+(?:de|do|da)\s+/i,
  /^(?:bônus|bonus)\s+(?:de|do|da)\s+/i,
  /\s+por\s+efeitos\s+aplicados$/i
];

function enxugar(rotulo: string): string {
  let texto = rotulo.trim();
  for (const poda of PODAS) texto = texto.replace(poda, "").trim();
  if (!texto) return rotulo;
  // A poda costuma começar o texto no meio da frase original ("Testes de...");
  // a maiúscula devolve a aparência de rótulo.
  return texto[0].toUpperCase() + texto.slice(1);
}

/**
 * O rótulo a exibir: o desta tabela, se houver; senão o do sistema, enxugado;
 * e, na falta dos dois, o caminho cru.
 */
export function rotuloDaMudanca(chave: string, rotuloDoModulo: string): string {
  const escolhido = ROTULOS[chave.trim()];
  if (escolhido) return escolhido;
  return rotuloDoModulo ? enxugar(rotuloDoModulo) : chave;
}
