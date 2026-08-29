# Arton de Bolso

Uma ficha de **Tormenta20** feita para o celular, que espelha em tempo real a
ficha que já existe no Foundry VTT. O jogador abre o navegador do telefone,
entra com o próprio usuário do Foundry e tem à mão os atributos, as perícias,
o inventário, os poderes e as magias — sem abrir o Foundry, sem notebook na
mesa, sem app para instalar.

Projeto pessoal de **Arthur Santos**, escrito para a mesa dele e liberado para
quem quiser usar.

Este repositório é o **front-end**. Ele depende de um módulo do Foundry, que
mora num repositório separado — ver [Como funciona](#como-funciona).

---

## Por que existe

A campanha era presencial. Precisei narrar uma aventura dela **on-line**, e
para isso passei todas as fichas para o Foundry.

Terminada a aventura, os jogadores não quiseram voltar ao papel: tinham
gostado da ficha digital, dos números que se atualizam sozinhos, de não
recalcular bônus a cada nível. Só que levar a ficha digital para a mesa
presencial não funcionava. **Notebook para todo mundo era inviável** — nem
todos têm, e cinco telas abertas numa mesa de jantar atrapalham mais do que
ajudam. E a **interface do Foundry no celular é ruim**: ela foi desenhada para
um mestre com mouse e tela grande, não para um jogador de pé conferindo
quantos PM sobraram.

O Arton de Bolso é a resposta a isso: a ficha do Foundry continua sendo a
fonte da verdade, e o celular ganha uma tela feita para o polegar.

---

## O princípio: ele nunca rola dados

Os dados são rolados **fisicamente, na mesa**. O app não rola nada e não
escreve no chat por conta própria.

Onde um teste precisaria de uma rolagem, ele mostra a **fórmula decomposta** e
explica de onde vem cada pedaço:

```
Furtividade          +8
  1d20
  + 4  Destreza
  + 2  Treino
  + 2  Outros efeitos
```

Você rola o d20 de verdade e soma. Essa foi uma decisão de mesa, não uma
limitação técnica: o barulho do dado na mesa é metade da graça de jogar
presencial.

---

## Como funciona

São três peças:

```
  ┌──────────────┐        ┌────────────────────┐        ┌───────────────┐
  │   Celular    │  HTTP  │   Servidor Node    │ Socket │    Foundry    │
  │  (navegador) │ ─────► │   (este repo)      │ ─────► │  do mestre    │
  │              │ ◄───── │                    │ ◄───── │  + o módulo   │
  └──────────────┘  SSE   └────────────────────┘        └───────────────┘
```

1. **O módulo do Foundry** (`arton-de-bolso`, repositório à parte) transforma o
   Foundry num *relay*. Ele roda dentro do client do **mestre** e é quem lê a
   ficha, aplica as mudanças e avisa quando algo muda — inclusive quando a
   mudança veio de alguém mexendo na ficha pelo Foundry.
2. **Este projeto** é um servidor Node que fala com o Foundry por WebSocket e
   entrega as telas ao navegador do jogador.
3. **O Foundry** continua sendo o Foundry. O mestre administra o mundo do
   mesmo jeito de sempre.

**O módulo não é opcional.** É ele que cria o canal de comunicação, e sem ele
instalado e ativo no mundo este app não tem com o que conversar. As duas
metades foram feitas juntas, para esse fim.

Não há banco de dados nem cadastro nosso: **quem autentica é o Foundry**, com
o mesmo usuário e a mesma senha da mesa. As permissões também são as dele —
quem é Owner de um personagem edita; quem é Observer só lê.

Todo o código — classes, funções, variáveis, comentários — é escrito em
**português do Brasil**.

---

## Requisitos

| | |
|---|---|
| Foundry VTT | versão 13 |
| Sistema | `tormenta20` |
| Módulo | `arton-de-bolso`, instalado e ativo no mundo |
| No dia do jogo | o **Foundry do mestre precisa estar aberto** — é o client dele que roda o relay |
| Para hospedar | Node.js e um lugar para rodar isto (uma VPS, um micro-servidor, ou a própria máquina na rede local) |
| Para o jogador | um navegador. Nada a instalar |

---

## Instalação

### 1. O módulo, no Foundry

Siga o README do repositório `arton-de-bolso`. Em resumo: a pasta do módulo
vai para `Data/modules/` do Foundry (há um `deploy.sh` que faz a cópia), e
depois é preciso ativá-lo em **Configurações do Mundo → Gerenciar Módulos**.

Toda vez que o módulo for atualizado, **dê F5 no client do mestre** — é ele que
executa o relay, e o módulo só recarrega junto com a página.

### 2. Este front-end

```bash
npm install
```

Copie o modelo de configuração e aponte para o seu Foundry:

```bash
cp .env.example .env.local
```

```bash
# .env.local
FOUNDRY_URL=http://endereco-do-foundry:30000
```

E suba:

```bash
npm run build && npm run start    # produção
npm run dev                       # desenvolvimento
```

O endereço que sair daí é o que os jogadores abrem no celular.

**Variáveis de ambiente:**

| Variável | Para quê |
|---|---|
| `FOUNDRY_URL` | URL absoluta do servidor Foundry. Obrigatória |
| `FOUNDRY_SOCKET_PATH` | Só se o Foundry usar um `routePrefix` customizado. Padrão: `/socket.io` |

Uma observação de operação: as sessões vivem na memória do processo. Reiniciar
o servidor derruba quem estava logado, e todos precisam entrar de novo.

---

## Preparando a mesa (mestre)

Três coisas, todas feitas pela interface normal do Foundry.

### Quem vê o quê

É a permissão de **Ownership** do Actor, nada além disso:

| Permissão | Onde aparece no app | O que o jogador faz |
|---|---|---|
| **Owner** | "Meus Personagens" | Lê e edita: PV, PM, itens, dinheiro, descanso |
| **Observer** | "Companheiros" | Só lê — toda escrita é recusada |

Dar Observer no personagem de um jogador para os outros é o que permite a
mesa conferir a ficha do colega ("quanto de PV você tem?") sem poder mexer.

### Poderes que se ativam

O app olha duas **tags** (`system.rolltags`) que você escreve no poder:

| Tag | O que muda |
|---|---|
| `ativo` | O poder ganha o botão **Ativar** no app |
| `lvl-06` | Agrupa o poder em "Nível 6" na lista. Sem ela, ele cai em "Base" (raça, origem, divindade) |

Ativar, num toque do jogador, faz três coisas do lado do Foundry: cobra o
custo em PM e itens, liga na ficha os Active Effects do poder (Fúria, Frenesi
— com a duração do próprio poder) e publica na mesa o card nativo do sistema.
Sem rolar dado nenhum.

Marcar `ativo` é decisão sua de propósito: adivinhar por heurística erraria
nos dois sentidos, porque existe passiva com execução preenchida e poder de
usar que não custa nada.

### Anotações e compêndio

Duas pastas de journal nascem sozinhas quando você abre o mundo:

- **"Anotações Jogadores"** — um diário por jogador. Cada um escreve o dele e
  lê o dos colegas.
- **"Conteúdos Para Jogadores"** — o que você quiser deixar à mão da mesa:
  retratos de NPC, regras da casa, cartas, mapas. **Liberar é dar Observador
  no journal**; não existe passo de publicação no app. Tirou a permissão, some
  da tela do jogador na hora.

---

## Usando (jogador)

### Entrando

1. Abra o endereço do app no navegador do celular.
2. Escolha **seu usuário** na lista — é o mesmo do Foundry.
3. Digite a senha do Foundry.

Um usuário por vez: quem já estiver conectado (no app ou no Foundry) aparece
como **"(em uso)"** e não pode ser escolhido de novo.

> **Dica:** adicione o site à tela de início do celular. Ele abre em tela
> cheia, como um aplicativo.

### Escolhendo o personagem

A tela inicial lista **Meus Personagens** e **Companheiros**, com nível e
dinheiro de cada um. Toque num para abrir a ficha. Para trocar depois, use o
botão **Menu** (na barra de baixo, no celular) — ele abre a mesma lista de
qualquer tela.

### As telas da ficha

A barra de baixo dá acesso às seções:

| Seção | O que tem |
|---|---|
| **Ficha** | Atributos, identidade, PV/PM/Defesa, resistências, sentidos, proficiências e os efeitos ativos |
| **Combate** | Armas em punho e guardadas, proteção, ataque e dano decompostos |
| **Perícias** | Todas, com a fórmula aberta de cada uma |
| **Poderes** | Agrupados por nível, com a descrição e o botão de ativar quando houver |
| **Mochila** | Inventário, espaços ocupados, dinheiro e o baú (o que ficou fora da mochila) |
| **Magias** | Por círculo, com preparação e conjuração. *Some da barra se o personagem não tiver magia nenhuma* |

Fora da ficha, no **Menu**: Início, Anotações, Compêndio e Configurações.

### O que dá para fazer

- **PV e PM** — os botões de + e − ajustam; tocar no número digita o valor
  direto.
- **Descansar** — escolha a condição (ruim, normal, confortável, luxuoso) e os
  cuidados recebidos; o app calcula quanto volta e aplica.
- **Equipar e guardar** — empunhar armas, vestir proteção, mover coisas entre
  a mochila e o baú.
- **Conjurar, ativar e usar** — abre um painel que mostra a conta antes de
  cobrar: o custo base, cada aprimoramento que você marcar, os itens que serão
  gastos e o total. Você confere e confirma num botão só.
- **Preparar magias** — para quem prepara.
- **Efeitos** — o que está pegando na ficha, de onde veio, e o botão de tirar
  o que já acabou.
- **Anotações** — seu diário da campanha, com texto formatado. As dos colegas
  ficam disponíveis para leitura.
- **Dinheiro** — editável na Mochila, por moeda.

Tudo o que você faz aparece na ficha do Foundry na hora, e tudo o que o mestre
faz no Foundry aparece no seu celular na hora.

### Deixando com a sua cara

Em **Configurações** há três eixos independentes:

- **Tema** — Claro, Escuro ou Sistema.
- **Cor de fundo** — Olive, Neutral ou Slate.
- **Cor de destaque** — sete cores, na ordem do círculo cromático.

A escolha fica no aparelho, então cada jogador tem a sua.

---

## Sobre o desenvolvimento

Este projeto foi construído **com ajuda de IA**. Boa parte do código foi
escrita em par com um assistente, e isso está dito aqui porque é a verdade do
processo, não porque muda o resultado.

O que muda o resultado é o que vem depois: **toda funcionalidade é revisada e
testada em jogo por gente**. Nada entra por ter compilado. As decisões de
regra foram conferidas contra o livro e contra o código-fonte do sistema
`tormenta20` — não por dedução —, e o que sobrevive é o que passou por uma
sessão real, com jogadores reclamando do que ficou ruim. Boa parte dos ajustes
deste app nasceu de alguém tentando usá-lo no meio de um combate e não
conseguindo.

---

## Solução de problemas

| Sintoma | Causa provável |
|---|---|
| A ficha não carrega, fica girando | O Foundry do mestre não está aberto. É o client dele que roda o relay |
| Meu usuário aparece "(em uso)" | Você já está conectado em outro lugar — no Foundry ou noutra aba. Saia de lá primeiro |
| Mudei algo no Foundry e o app não acompanhou | O mestre precisa dar **F5** depois de atualizar o módulo. Trocar de tela no app também força uma releitura |
| Um poder não tem botão de ativar | Falta a tag `ativo` nele |
| "Meus Personagens" está vazio | Falta Ownership no Actor para o seu usuário |
| Todo mundo caiu de uma vez | O servidor do front reiniciou. As sessões ficam em memória; é só entrar de novo |
