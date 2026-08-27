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
  allowedDevOrigins: ["dev.arthursantos.com.br"],

  /**
   * Nada de cache em desenvolvimento.
   *
   * O `next dev` já manda `no-cache, must-revalidate` nos chunks, mas quem
   * responde ao celular é a Cloudflare do túnel, e ela reescreve isso para o
   * Browser Cache TTL da zona — medido: `max-age=14400, must-revalidate` e
   * `cf-cache-status: REVALIDATED` em `/_next/static/*.js`. Resultado: o
   * iPhone segura o app de quatro horas atrás e as mudanças não aparecem.
   * `no-store` tira o recurso da elegibilidade de cache, na borda e no
   * navegador.
   *
   * Só em desenvolvimento: em produção o hash no nome do arquivo é o que
   * torna o cache longo dos assets seguro, e abrir mão dele seria pagar
   * banda à toa.
   */
  async headers() {
    if (process.env.NODE_ENV !== "development") return [];
    return [
      {
        source: "/:caminho*",
        headers: [{ key: "Cache-Control", value: "no-store, must-revalidate" }]
      }
    ];
  }
};

export default nextConfig;
