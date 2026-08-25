import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Servidor Node de verdade (`next build && next start`) numa VPS própria,
  // falando com o Foundry (rodando à parte) via app/lib/foundry-server.ts —
  // ver docs/arquitetura.md. Nada de export estático aqui: precisamos de
  // Route Handlers dinâmicos (login, SSE) com estado no processo.
};

export default nextConfig;
