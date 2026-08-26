/**
 * Marca do app. Decorativo em todos os usos: sempre há um texto ao lado (ou
 * um `title` no link que o envolve) dizendo "Arton de Bolso", então repetir
 * o nome aqui só faria o leitor de tela falar duas vezes.
 *
 * A cor vem de fora, por `text-*` — ver `.logo-marca` no globals.css.
 */
export default function Logo({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`logo-marca ${className}`} />;
}
