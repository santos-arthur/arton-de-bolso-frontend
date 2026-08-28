"use client";

import { useMemo } from "react";
import { sanitizarHtml } from "../lib/html-seguro";

/**
 * Texto formatado vindo do Foundry — anotações e compêndio. Mesma tipografia das
 * descrições de poderes e magias (`.prosa-foundry`), e a mesma peneira de
 * segurança antes de entregar ao `dangerouslySetInnerHTML`: ver
 * `lib/html-seguro.ts`.
 */
export default function Prosa({ html, className = "" }: { html: string; className?: string }) {
  const seguro = useMemo(() => sanitizarHtml(html), [html]);
  if (!seguro) return null;
  return <div className={`prosa-foundry ${className}`} dangerouslySetInnerHTML={{ __html: seguro }} />;
}
