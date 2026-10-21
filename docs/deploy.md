# Deploy — rpg.arthursantos.com.br

Manual, na VM Debian do Proxmox. Mesma infraestrutura do portfólio
(`arthursantos/portfolio/docs/deploy.md`): o Traefik descobre o container
pelas labels do `compose.yaml` na rede `web` e roteia
`rpg.arthursantos.com.br` até ele; o TLS fica com o Cloudflare Tunnel.

## Primeira vez

Na Cloudflare não há nada a fazer: o túnel já manda `*.arthursantos.com.br`
para o Traefik, que escolhe o container pelo host.

```bash
mkdir -p /home/arthur/homelab/rpg
cd /home/arthur/homelab/rpg
git clone https://github.com/santos-arthur/design-telas-arton-de-bolso.git arton-de-bolso
cd arton-de-bolso

# Onde o Foundry responde. É o servidor Node do app que fala com ele, não o
# navegador do jogador — a porta 30000 do Windows precisa aceitar a VM.
echo 'FOUNDRY_URL=http://<ip-do-foundry>:30000' > .env

docker network ls | grep web    # a rede do Traefik precisa existir
docker compose up -d --build --wait
```

## Atualizar

```bash
cd /home/arthur/homelab/rpg/arton-de-bolso
git pull
docker compose up -d --build --wait
docker image prune -f
```

## Trocar o FOUNDRY_URL

Editar o `.env` e recriar o container (sem rebuild — a variável é lida em
tempo de execução):

```bash
docker compose up -d
```

Trocar o endereço derruba as sessões abertas: elas vivem na memória do
processo.

## Diagnóstico

```bash
docker compose ps                         # está healthy?
docker compose logs -f arton-de-bolso
docker network inspect web --format '{{range .Containers}}{{.Name}} {{end}}'
```

Se não aparecer no Traefik, os comandos de
`arthursantos/portfolio/docs/diagnostico-traefik.md` servem trocando
`portfolio` por `arton-de-bolso`.
