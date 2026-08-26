import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Servidor Node de verdade (`next build && next start`) numa VPS própria,
  // falando com o Foundry (rodando à parte) via app/lib/foundry-server.ts —
  // ver docs/arquitetura.md. Nada de export estático aqui: precisamos de
  // Route Handlers dinâmicos (login, SSE) com estado no processo.

  // Em desenvolvimento o Next só aceita requisições vindas do host em que
  // subiu (localhost) — sem isto, abrir o app pelo túnel do Cloudflare
  // (`cloudflared tunnel --config ~/.cloudflared/config-arton-dev.yml run
  // arton-dev`, ver README) quebra os assets de dev e o hot reload. Não tem
  // efeito nenhum em produção.
  allowedDevOrigins: ["dev.arthursantos.com.br"]
};

export default nextConfig;
