import CampoComDetalhe, { type ItemDetalhe } from "./components/campo-com-detalhe";

const ATRIBUTOS: { sigla: string; itens: ItemDetalhe[]; temporario?: number }[] = [
  {
    sigla: "FOR",
    itens: [
      { rotulo: "Valor Base", valor: 11 },
      { rotulo: "Raça", valor: 1 },
      { rotulo: "Aumento de Atributo (Poder)", valor: 1 },
    ],
  },
  {
    sigla: "DES",
    itens: [{ rotulo: "Valor Base", valor: 2 }],
  },
  {
    sigla: "CON",
    itens: [
      { rotulo: "Valor Base", valor: 1 },
      { rotulo: "Raça", valor: 1 },
    ],
  },
  {
    sigla: "INT",
    itens: [{ rotulo: "Valor Base", valor: -1 }],
  },
  {
    sigla: "SAB",
    itens: [{ rotulo: "Valor Base", valor: 0 }],
  },
  {
    sigla: "CAR",
    itens: [
      { rotulo: "Valor Base", valor: 2 },
      { rotulo: "Raça", valor: 1 },
      { rotulo: "Elixir da Persuasão (Temporário)", valor: 1 },
    ],
    temporario: 1,
  },
];

function CampoAtributo({ sigla, itens, temporario }: { sigla: string; itens: ItemDetalhe[]; temporario?: number }) {
  const total = itens.reduce((soma, item) => soma + item.valor, 0);
  const sinal = total >= 0 ? "+" : "";

  return (
    <CampoComDetalhe
      classeContainer="relative w-full max-w-26"
      classeGatilho="flex aspect-square w-full max-h-24 flex-col items-center justify-center rounded-lg border-2 border-red-900 font-bold text-red-900 dark:text-red-700"
      itens={itens}
      total={total}
      temporario={temporario}
    >
      <legend className="mx-auto px-2 text-center text-lg">
        {sigla}
      </legend>
      <div className="text-3xl pb-2">
        {sinal}{total}
      </div>
    </CampoComDetalhe>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col gap-4 py-6 text-olive-800 dark:text-olive-400">
      <div className="grid grid-cols-3 justify-items-center gap-4 sm:grid-cols-6">
        {ATRIBUTOS.map((atributo) => (
          <CampoAtributo
            key={atributo.sigla}
            sigla={atributo.sigla}
            itens={atributo.itens}
            temporario={atributo.temporario}
          />
        ))}
      </div>

      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
        tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim
        veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea
        commodo consequat.
      </p>
      <p>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
        dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
        proident, sunt in culpa qui officia deserunt mollit anim id est
        laborum.
      </p>
    </div>
  );
}
