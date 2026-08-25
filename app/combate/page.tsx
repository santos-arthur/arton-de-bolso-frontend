import PaginaPlaceholder from "../components/pagina-placeholder";

// PV, PM, Defesa e os recursos genéricos moram na <BarraResumo /> (visível em
// todas as abas da ficha) — esta tela não os repete.
export default function Page() {
  return <PaginaPlaceholder titulo="Combate" />;
}
