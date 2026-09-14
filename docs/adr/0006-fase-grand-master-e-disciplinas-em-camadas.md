# 0006 — Fase Grand Master: Disciplinas em camadas (substituição, não zeramento) e novo teto de rank

## Status

**Implementada.** Livro 13 (*The Plague Lords of Ruel*) jogável de ponta a ponta — primeiro livro da
fase Grand Master, distinta da fase Magnakai (Livros 6-12, agora completa) e da fase Kai (Livros
1-5). Mergeado em `main` via PR, publicado via `publish-image.yml`.

## Contexto

Um novo diretório de topo apareceu no repositório, `grand_master/tplr/en/xhtml/lw/13tplor/` — fora
tanto de `kai/` quanto de `magnakai/`. Isso é o Livro 13 da série, o primeiro depois da conclusão da
fase Magnakai (Livro 12, *The Masters of Darkness*, terminou com uma vitória narrativa completa sobre
Darklord Gnaag, mas com forward-link explícito pro Livro 13 — não é um final de série, é só o fim de
uma fase).

Investigando o conteúdo real (`discplnz.htm`, `gamerulz.htm`, `equipmnt.htm`, `imprvdsc.htm`,
`levels.htm`, e a errata), confirmei que a fase Grand Master **não é a fase Magnakai com um nome de
rank novo** — é um terceiro sistema de Disciplinas, com uma regra de interação com o sistema anterior
nunca vista nas duas transições de fase anteriores:

- São **12 Disciplinas Grand Master**: 10 são upgrades nomeados das 10 Disciplinas Magnakai (ex.
  Weaponmastery → Grand Weaponmastery, Psi-surge → Kai-surge), e **2 são totalmente novas** — Magi-magic
  e Kai-alchemy (magia de batalha, sem efeito numérico definido ainda neste livro; "as you advance in
  rank, so will your knowledge... increase" — mesmo padrão de placeholder narrativo já visto em
  `imprvdsc.htm` de livros anteriores).
- O personagem escolhe 4 Disciplinas Grand Master livremente pra começar — **sem tabela de
  conversão** a partir das Disciplinas Magnakai que já tinha, mesmo padrão da transição Kai→Magnakai
  do Livro 6.
- **A diferença crucial**: ao contrário da transição Kai→Magnakai (onde `disciplines` é zerado
  porque as duas listas nunca deveriam coexistir), a transição Magnakai→Grand Master **não zera**
  `magnakaiDisciplines`. Confirmado por uma nota de errata em `discplnz.htm`: *"Weaponmastery bonuses
  are replaced by Grand Weaponmastery bonuses, not added cumulatively"* — ou seja, a Disciplina nova
  **substitui** o bônus da antiga quando ambas se aplicariam ao mesmo mecanismo, em vez de somar; mas
  a antiga continua valendo como um "fallback" sempre que o jogador não escolheu o upgrade
  correspondente. Isso é uma terceira relação entre camadas de regras que este projeto nunca tinha
  modelado: nem "sempre soma" (como Shield + Weaponmastery, itens diferentes), nem "populações
  mutuamente exclusivas" (Kai vs Magnakai), mas "a melhor camada disponível vence, sem empilhar".
- **Novo teto de rank**: `levels.htm` define uma escada de 12 ranks inteiramente nova (Kai Grand
  Master Senior → ... → Kai Supreme Master), sem relação com `MAGNAKAI_RANKS`. Um personagem que
  termina o Livro 12 (rank Archmaster, 9 Disciplinas Magnakai no máximo) começa o Livro 13 já no
  **rank 4** dessa nova escada ("Kai Grand Defender") com as 4 Disciplinas Grand Master iniciais —
  os ranks 1-3 existem só na lore (o personagem "pulou" eles), nunca são atribuídos de verdade.
- **Novo mecanismo de bônus permanente**: *"For every Grand Master Discipline you possess, in excess
  of the original four disciplines you begin with, you may add 1 point to your basic COMBAT SKILL
  score and 2 points to your basic ENDURANCE points score."* — cada Disciplina extra (a partir da 5ª)
  dá um bônus permanente de +1 CS/+2 EP na ficha, diferente de todo bônus condicional de combate já
  modelado (Weaponmastery, Psi-surge, etc., que só se aplicam durante um combate específico).
- **Grand Weaponmastery** tem seu próprio checklist de "2 armas" pra começar — textualmente distinto
  do checklist de Weaponmastery (3 armas, crescido até 9 possíveis pelo fim do Livro 12).
- **Itens Especiais**: pela primeira vez, a transferência é uma **lista fechada de 10 nomes**
  específicos (Crystal Star Pendant, Sommerswerd, etc.) em vez de "carrega tudo", que valia em toda
  transição anterior.
- Mochila sobe de 8 pra 10 slots; bônus de ouro sobe de +10 pra +20 (`equipmnt.htm`: "add 20 to the
  number you have picked").

## Decisão

### `magnakaiDisciplines` não é zerado ao cruzar pra Grand Master; `grandMasterDisciplines` é um terceiro campo irmão

Segui a mesma filosofia da ADR-0005 (campos separados por sistema de regras, em vez de um union
unificado ou um array de objetos `{fase, id}`) — mas com uma mudança importante na regra de
zeramento na fronteira:

```ts
const crossingIntoGrandMaster =
  getBook(bookId).phase === 'grand_master' && getBook(previous.bookId).phase !== 'grand_master';
// magnakaiDisciplines e masteredWeapons NÃO são zerados aqui — passam por `...previous` como
// qualquer outro campo, ao contrário de disciplines/weaponskillWeapon na fronteira Kai→Magnakai.
```

A alternativa óbvia — zerar `magnakaiDisciplines` do mesmo jeito que `disciplines` foi zerado no
Livro 6 — contraria diretamente o texto fonte (`gamerulz.htm`: *"You may also benefit from the
Disciplines that you've mastered (e.g. Weaponmastery, Curing, and Psi-surge bonuses)... Only if you
have completed these previous adventures will you benefit from the appropriate bonuses"*). Zerar
teria sido mais simples de implementar, mas errado: um personagem que NÃO escolheu Grand Weaponmastery
mas ainda tem Weaponmastery Magnakai deve continuar recebendo o bônus de Weaponmastery.

### Bônus "melhor camada vence, sem empilhar" — não uma checagem de fase, uma checagem por mecanismo

Em vez de resolver isso com um "if grand_master phase, usa X, senão usa Y" (que erraria assim que um
personagem tivesse Curing Magnakai mas não Deliverance, ou vice-versa — casos legítimos, já que a
escolha das 4 Disciplinas iniciais é livre), cada mecanismo em `combat.ts`/`disciplines.ts` faz sua
própria checagem, na ordem "camada mais alta primeiro":

```ts
// combat.ts — Weaponmastery/Grand Weaponmastery
} else if (chart.grandMasteredWeapons.includes(chart.equippedWeapon)) {
  skill += GRAND_WEAPONMASTERY_BONUS; // +5, substitui, não soma
} else if (chart.masteredWeapons.includes(chart.equippedWeapon)) {
  skill += ...; // tiers Magnakai existentes (Scion-kai/Archmaster/base), inalterados
}

// combat.ts — Psi-surge/Kai-surge, via um resolvedor de "tier"
function resolvePsiSurgeTier(chart): PsiSurgeTier | null {
  if (chart.grandMasterDisciplines.includes('KaiSurge')) return TIER_KAI_SURGE; // +8/-1, substitui
  if (chart.magnakaiDisciplines.includes('PsiSurge')) return isArchmaster(chart) ? TIER_ARCHMASTER : TIER_BASE;
  return null;
}

// disciplines.ts — Curing/Deliverance (cura em combate), a UI escolhe qual botão mostrar
const useDeliveranceInstead = canUseDeliverance(chart); // Deliverance: EP<=8, +20
const showArchmasterCuring = !useDeliveranceInstead && canUseArchmasterCuring(chart); // fallback: EP<=6, +20
```

Essa forma generaliza pra qualquer par (mecanismo Magnakai, upgrade Grand Master) sem precisar saber
em que fase o chart está — só olha os dois arrays de Disciplinas diretamente, então funciona
igualmente bem pra um personagem hipotético que "pulou" alguma Disciplina Magnakai específica.

### `grandMasteredWeapons` como campo separado de `masteredWeapons`, não fundido

Cogitei reaproveitar `masteredWeapons` pra Grand Weaponmastery também (afinal, é o mesmo conceito —
"lista de armas em que sou hábil"). Rejeitei: o texto diz que a Grand Defender começa "eficiente em
DUAS armas" — um número menor que o que a maioria dos personagens já teria acumulado em
`masteredWeapons` depois de crescer por até 6 livros Magnakai (3 iniciais + até 6 de crescimento = até
9). Fundir os dois exigiria decidir arbitrariamente "quais 2 das até 9 armas existentes contam pra
Grand Weaponmastery" — uma decisão que o texto não especifica e que inventaria uma regra. Manter os
dois arrays separados, com `combat.ts` checando `grandMasteredWeapons` primeiro e caindo pra
`masteredWeapons` depois (mesmo padrão "melhor camada vence" acima), evita essa invenção.

### Lista de Itens Especiais transferíveis como constante fechada, verificada na fronteira de fase

```ts
const GRAND_MASTER_CARRYOVER_SPECIAL_ITEMS = new Set([
  'Crystal Star Pendant', 'Sommerswerd', 'Silver Helm', 'Dagger of Vashna', 'Silver Bracers',
  'Jewelled Mace', 'Silver Bow of Duadon', 'Helshezag', 'Kagonite Chainmail', 'Korlinium Scabbard',
]);
```

Filtrado só quando `crossingIntoGrandMaster` é verdadeiro — uma transferência dentro da própria fase
Grand Master (Livro 13→14, no futuro) continua carregando tudo, sem essa restrição.

### Escada de rank nova (`GRAND_MASTER_RANKS`), não uma extensão de `MAGNAKAI_RANKS`

`kaiRank.ts` ganhou um terceiro array e uma terceira função (`getGrandMasterRank`), com o mesmo
formato de dispatch das outras duas (`getRankForChart` agora escolhe entre as três com base em
`getBook(chart.bookId).phase`). `MAGNAKAI_RANKS` já tinha "Kai Grand Master" como último rank —
poderia ter sido tentador estender esse array com mais 12 entradas, mas os nomes/limiares da nova
escada são de um sistema conceitualmente diferente (rank = contagem de Disciplinas Grand Master, não
Magnakai), então tratá-la como array próprio evita qualquer acoplamento acidental entre as duas
contagens.

## Trade-offs considerados

**Substituição por mecanismo, verificando os dois arrays diretamente (escolhida)**
- ✅ Correto mesmo pra combinações parciais (Curing sem Deliverance, ou vice-versa).
- ✅ Nenhuma checagem de fase se espalha pelo motor — o mesmo padrão "o array certo nunca mente"
  desde a ADR-0005 continua valendo.
- ❌ Mais construções de "resolver tier" repetidas por mecanismo (Weaponmastery, Psi-surge, Curing) —
  aceito, é mecânico, seguindo o mesmo molde já usado pros tiers Tutelary/Scion-kai/Archmaster dentro
  da própria Magnakai.

**Zerar `magnakaiDisciplines` na fronteira, do jeito que `disciplines` foi zerado no Livro 6
(rejeitada)**
- ❌ Contraria o texto fonte explicitamente (`gamerulz.htm`) — os bônus Magnakai continuam relevantes
  no Grand Master, só sendo substituídos onde e quando o upgrade correspondente for escolhido.

**Fundir `grandMasteredWeapons` em `masteredWeapons` (rejeitada)**
- ❌ Exigiria inventar uma regra pra decidir quais armas existentes "viram" Grand-masterizadas,
  informação que o texto fonte não especifica.

## Consequências

**Positivas**
- Livro 13 jogável com as regras reais da série — inclusive a interação sutil "substitui, não soma"
  entre Magnakai e Grand Master, confirmada por leitura direta da errata oficial, não por suposição.
- Estrutura genérica o suficiente pra reaproveitar quase tudo (mecanismo de registro por livro,
  `chooseEquipmentOptions` com `chooseCount`/`maxBackpackItems` configuráveis, `hasPuzzle`) sem
  nenhuma mudança nesses mecanismos — só dados novos e a lógica de "melhor camada" em `combat.ts`/
  `disciplines.ts`.

**Negativas / pendências**
- **Magi-magic e Kai-alchemy** (as 2 Disciplinas totalmente novas) não têm nenhum efeito numérico
  ainda — o próprio livro diz que os feitiços serão detalhados em livros futuros. Só rastreamos a
  posse da Disciplina por enquanto, mesmo padrão de pendência documentada já usado outras vezes
  (ex. Lore-circles, ainda não implementado, issue #35/JOGOS-80).
- **Kai-screen** foi modelado como bloqueio total de dano de Mindblast, igual Psi-screen/Mindshield —
  o texto do Livro 13 só diz "a força e capacidade... aumentam conforme o rank avança", sem dar um
  número diferente; se um livro futuro especificar uma regra diferente pra Kai-screen, revisar aqui.
- **`SAVE_VERSION` 6 → 7** (`ActionChart` ganha `grandMasterDisciplines` e `grandMasteredWeapons`) —
  saves anteriores a esta versão deixam de carregar.

## Atualização — Livro 14

O Livro 14 (*The Captives of Kaag*) confirmou duas coisas que este ADR já previa, e trouxe uma
pendência nova de design (não de dados).

### `contentDirName`: pasta fonte com nome colidente, resolvido sem tocar no conteúdo

A pasta de conteúdo deste livro é `grand_master/tck/` — coincidentemente o mesmo nome já usado pro
Livro 3 (`tck`, fase Kai). Como `parseContent.ts`'s `contentDirFor` usava `book.id` diretamente como
nome de pasta, isso forçaria escolher entre (a) usar `id: 'tck'` de novo, colidindo com o Livro 3 no
registro `BOOKS` (dois livros com o mesmo id — inválido), ou (b) renomear a pasta fonte (arriscado,
já que é conteúdo externo que pode ser resincronizado). Escolhi uma terceira opção: um novo campo
opcional `contentDirName?: string` em `BookMeta`, usado só quando o nome da pasta real diverge do id
escolhido pro registro:

```ts
{ id: 'tcok', code: '14tcok', ..., contentDirName: 'tck' }
```

`contentDirFor` passou a usar `book.contentDirName ?? book.id` — todo outro livro (cuja pasta já bate
com o id) continua funcionando sem nenhuma mudança de comportamento.

### Confirmado: a whitelist de Itens Especiais é uma regra de fronteira única, não recorrente

`gamerulz.htm` do Livro 14 deixa isso explícito: *"only the following Special Items may be carried
over **from the Lone Wolf Kai (Books 1–5) and Magnakai (Books 6–12) series** to the Lone Wolf Grand
Master series (Books 13-onwards)"* — a restrição é sobre entrar na série Grand Master, não sobre
cada livro dentro dela. Isso já funcionava certo sem nenhuma mudança de código: `crossingIntoGrandMaster`
em `carryOverCharacterToBook` só fica `true` quando a fase anterior não era `'grand_master'`, então
uma transferência Livro 13→14 (ambos já `grand_master`) não filtra nada — confirmado com um teste de
regressão dedicado.

### Pendência nova: ataque simultâneo a múltiplos inimigos (Kai-surge, rank Kai Grand Guardian)

`imprvdsc.htm` do Livro 14 finalmente tem conteúdo real pro rank Kai Grand Guardian (5 Disciplinas) —
mas, ao contrário dos ranks anteriores que sempre tiveram no máximo UMA entrada com número real (a de
Weaponmastery, nos ranks Tutelary/Scion-kai/Mentora/Archmaster), aqui a única entrada com regra
mecânica de verdade não é um número de Combat Skill/Endurance: *"Kai Grand Guardians who possess
mastery of this Discipline [Kai-surge] are able to attack up to three enemies in psychic combat
simultaneously."* Isso é uma mudança estrutural de fluxo de combate — o motor resolve hoje contra um
inimigo por vez, ciclando sequencialmente pelo array de `encounters` (`CombatModal.tsx`). O texto não
especifica os detalhes de resolução simultânea (todos os 3 inimigos causam dano de volta na mesma
rodada? o Combat Ratio é calculado uma vez contra os 3, ou uma vez por inimigo?), então implementar
agora exigiria inventar uma regra. Decisão: registrar como pendência real de design, mesma categoria
do bônus de Weaponmastery+Bow (pendente desde o Livro 6 por falta de um gancho de UI adequado) — não
implementado agora, sem gambiarra.

As outras 5 entradas do rank Kai Grand Guardian (Animal Mastery, Assimilance, Grand Huntmastery,
Kai-screen, Magi-magic) são puramente narrativas — mesmo padrão dos ranks Primate/Principalin.

Nenhuma mudança de código em `combat.ts`/`disciplines.ts` neste livro além do necessário pro registro
básico (`books.ts`/`bookEquipment.ts`) — as regras de Disciplinas, crescimento e combate seguem
idênticas ao Livro 13.
