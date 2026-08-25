"use client";

import { useFoundry } from "../lib/foundry-provider";

/** Faixa de erro vinda do Foundry (permissão negada, relay fora do ar, etc.). */
export default function AvisoServidor() {
  const { erroServidor } = useFoundry();
  if (!erroServidor) return null;

  return (
    <div role="alert" className="w-full bg-red-900 px-4 py-1 text-center text-sm font-semibold text-olive-50">
      {erroServidor}
    </div>
  );
}
