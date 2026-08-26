# Arton de Bolso — Front-end

Front-end web standalone da ficha simplificada de Tormenta20. Servidor Node
(Next.js, com Route Handlers de verdade — não export estático), pensado para
rodar numa VPS própria (ex: `rpg.arthursantos.com.br`), enquanto o Foundry
roda separado (ex: numa máquina pessoal com a porta exposta). Conversa com o
Foundry por WebSocket através do módulo irmão
[`../arton-de-bolso/`](../arton-de-bolso/README.md), que faz o papel de
relay — ver [`../docs/arquitetura.md`](../docs/arquitetura.md).

Todo o código (classes, funções, variáveis) é escrito em **português do Brasil**.

## Como funciona

Todo o handshake com o Foundry (login via `POST /join`, conexão socket.io)
acontece **dentro do processo Node deste front** — nunca no navegador do
jogador. Isso existe por causa do cookie de sessão do Foundry
(`SameSite=Strict`) combinado com o CORS dele (`Access-Control-Allow-Origin: *`):
essa combinação impede um navegador de completar esse login em origem
cruzada, mas não afeta uma chamada servidor-a-servidor (sem navegador, sem
política de cookie de navegador).

- **[`app/lib/foundry-server.ts`](app/lib/foundry-server.ts)** — único
  arquivo que fala HTTP/socket.io com o Foundry. Mantém uma sessão por
  jogador logado (em memória do processo — reinício do servidor derruba
  todo mundo, precisam logar de novo).
- **`app/api/login`** — recebe usuário/senha do navegador, faz o login no
  Foundry por trás, e devolve um cookie próprio (`ab_sessao`, httpOnly)
  referenciando a sessão em memória.
- **`app/api/sessao`** — checagem rápida de "já estou logado?".
- **`app/api/usuarios`** — lista de usuários do Foundry (pro dropdown de
  login), cada um com `ocupado`: quem já está conectado (client do Foundry
  aberto, ou sessão aberta aqui) aparece como "(em uso)" e não pode ser
  escolhido. A recusa de verdade é do servidor — `autenticar()` reconfere
  antes do `POST /join`, com dados frescos. Ver
  [`../docs/arquitetura.md`](../docs/arquitetura.md#login-exclusivo-por-usuário-2026-08-26).
- **`app/api/ficha/eventos`** — Server-Sent Events: empurra a ficha (e
  qualquer atualização) pro navegador em tempo real.
- **`app/api/ficha/acao`** — recebe uma ação do navegador (ajustar PV,
  equipar item, etc.) e repassa pro Foundry.
- **[`app/lib/foundry-provider.tsx`](app/lib/foundry-provider.tsx)** — único
  arquivo do lado do navegador que sabe desses endpoints; todo o resto da UI
  usa só `useFoundry()`.

## Variáveis de ambiente

- `FOUNDRY_URL` — URL absoluta do servidor Foundry (ex: `http://meu-host:30000`).
- `FOUNDRY_SOCKET_PATH` — opcional, só se o Foundry usar um `routePrefix`
  customizado (padrão: `/socket.io`).

## Rodando

```bash
npm install
npm run dev     # desenvolvimento
# ou
npm run build && npm run start   # produção — processo Node normal, sem passo de export
```

## Testando fora da máquina (túnel Cloudflare)

Para abrir o app no celular ou fora da rede local **sem fazer deploy**, há um
túnel do Cloudflare publicando o `next dev` local em
`https://dev.arthursantos.com.br`:

```bash
npm run dev                                                              # terminal 1
cloudflared tunnel --config ~/.cloudflared/config-arton-dev.yml run arton-dev   # terminal 2
```

O túnel se chama `arton-dev` e vive só nesses dois processos — fechou o
terminal, o domínio para de responder (o CNAME continua apontando pra ele, e
volta a funcionar no próximo `run`). Ele não encosta no `config.yml` dos
outros túneis: a configuração é o arquivo próprio `config-arton-dev.yml`.

Duas coisas que isso implica:

- `allowedDevOrigins` no `next.config.ts` precisa listar o domínio — em
  desenvolvimento o Next recusa requisições vindas de outro host, e sem isso
  os assets de dev e o hot reload quebram.
- **Enquanto o túnel está de pé, a tela de login fica pública na internet.**
  Quem tiver o endereço vê o formulário; o que protege as fichas é a senha do
  usuário no Foundry. Se algum usuário do mundo estiver sem senha, esse é o
  buraco — e a resposta certa é pôr senha nele, ou deixar o túnel no ar só
  durante o teste. O Foundry em si não fica exposto: quem fala com ele é o
  processo Node, não o navegador.

## Pendências conhecidas

- **Sem persistência de sessão**: tudo em memória do processo. Reiniciar o
  servidor derruba todos os jogadores logados (precisam entrar de novo) —
  aceitável na escala atual, mas seria o primeiro ponto a resolver antes de
  qualquer necessidade de múltiplas instâncias/deploys sem downtime.
- **Vários mestres conectados ao mesmo tempo** no lado do módulo Foundry
  ainda pode gerar respostas duplicadas — ver `arton-de-bolso/README.md`.
