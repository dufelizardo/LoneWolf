export interface Footnote {
  section: number;
  note: string;
}

export const FOOTNOTES: Footnote[] = [
  {
    section: 113,
    note: 'Cada Refeição de Laumspur pode ser consumida quando o texto pedir uma Refeição, e além disso restaura 3 pontos de ENDURANCE. Também pode ser consumida a qualquer momento apenas para curar ENDURANCE, sem contar como Refeição.',
  },
  {
    section: 147,
    note: 'O texto desta seção assume que você veio da Seção 28. Se você chegou aqui pela primeira vez vindo da Seção 42, a última frase e as duas escolhas devem ser lidas como uma variação equivalente (mesmas seções de destino).',
  },
  {
    section: 347,
    note: 'Você pode levar quantas Tochas conseguir carregar. Cada Tocha ocupa um slot de Item de Mochila na sua Ficha de Aventura.',
  },
  {
    section: 349,
    note: 'Livros seguintes da série perguntam se você ainda possui o Pingente da Estrela de Cristal. Você pode decidir se quer manter o Pingente ou não.',
  },
];

export function getFootnote(section: number): Footnote | undefined {
  return FOOTNOTES.find((f) => f.section === section);
}
