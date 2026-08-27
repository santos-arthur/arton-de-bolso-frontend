"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/**
 * Liga um <input type="number"> a um valor que vive no servidor.
 *
 * Enquanto o campo está sendo editado ele guarda um rascunho local e ignora o
 * valor que chega de fora — sem isso, cada tecla viraria uma escrita no
 * Foundry (digitar "12" passa por "1") e um push do relay no meio da
 * digitação sobrescreveria o que está sendo escrito. O valor só é enviado ao
 * sair do campo ou no Enter; Escape descarta o rascunho.
 */
export function useCampoNumerico(
  valor: number,
  aoConfirmar: (novo: number) => void,
  { min = 0, max }: { min?: number; max?: number } = {}
) {
  const [rascunho, setRascunho] = useState<string | null>(null);

  function confirmar() {
    if (rascunho === null) return;
    const bruto = Number(rascunho);
    setRascunho(null);
    if (Number.isNaN(bruto)) return;
    const limitado = Math.max(min, max === undefined ? bruto : Math.min(max, bruto));
    if (limitado !== valor) aoConfirmar(limitado);
  }

  return {
    // Fora da edição o campo espelha o servidor; durante, o rascunho manda.
    value: rascunho ?? String(valor),
    onFocus: () => setRascunho(String(valor)),
    onChange: (evento: { target: { value: string } }) => setRascunho(evento.target.value),
    onBlur: confirmar,
    onKeyDown: (evento: KeyboardEvent<HTMLInputElement>) => {
      if (evento.key === "Enter") evento.currentTarget.blur();
      if (evento.key === "Escape") {
        setRascunho(null);
        evento.currentTarget.blur();
      }
    }
  };
}

/**
 * Contador de −/+ ligado a um valor que vive no servidor. Mesma ideia do
 * `useCampoNumerico`, para quem ajusta a toques em vez de digitar: os toques
 * mexem num número local, o valor que chega de fora é ignorado enquanto a mão
 * está na tela, e só o **resultado** vai para o Foundry — quatro toques para
 * baixo e três para cima viram um único −1.
 *
 * Sem isso, cada toque era uma escrita e um push de volta: com o dedo rápido,
 * o número dançava (mostrava o estado de duas escritas atrás) e a mochila
 * levava seis mensagens para andar uma casa.
 *
 * Ao soltar, o número volta a espelhar a ficha — que a essa altura já traz o
 * palpite otimista do provider. Se o Foundry recusar o ajuste, a ficha
 * ressincronizada corrige a tela: é o único caso em que o número se mexe
 * sozinho.
 */
export function useContadorAdiado(
  valor: number,
  aoAjustar: (delta: number) => void,
  { min = 0, atrasoMs = 600 }: { min?: number; atrasoMs?: number } = {}
) {
  const [local, setLocal] = useState<number | null>(null);
  const acumulado = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // A função mais recente, sem refazer o efeito de limpeza a cada render.
  // Guardada num efeito, e não no corpo: mexer em ref durante o render é
  // justamente o que quebra quando o React re-renderiza por conta própria.
  const enviar = useRef(aoAjustar);
  useEffect(() => {
    enviar.current = aoAjustar;
  });

  const mostrado = local ?? valor;

  function despachar() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const total = acumulado.current;
    acumulado.current = 0;
    // O envio vem antes de soltar o número: o palpite do provider entra no
    // mesmo passo, e a tela não pisca o valor antigo entre os dois.
    if (total) enviar.current(total);
    setLocal(null);
  }

  // Sair da tela com toque pendente não pode perder o ajuste — fechar o
  // cartão desmonta o contador, e o item já apareceu gasto para o jogador.
  useEffect(() => {
    return () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
      const total = acumulado.current;
      acumulado.current = 0;
      if (total) enviar.current(total);
    };
  }, []);

  return {
    valor: mostrado,
    ajustar(delta: number) {
      // O piso pode comer parte do toque: com 1 unidade, um −1 vale −1 e o
      // seguinte não vale nada.
      const alvo = Math.max(min, mostrado + delta);
      const efetivo = alvo - mostrado;
      if (!efetivo) return;
      acumulado.current += efetivo;
      setLocal(alvo);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(despachar, atrasoMs);
    }
  };
}
