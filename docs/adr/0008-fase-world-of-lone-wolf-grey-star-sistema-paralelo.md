# 0008 — Fase World of Lone Wolf: sistema de personagem/combate paralelo isolado ("Grey Star the Wizard")

## Status

**Implementada.** Livros 1 (*Grey Star the Wizard*), 2 (*The Forbidden City*) e 3 (*Beyond the Nightmare
Gate*) jogáveis de ponta a ponta — primeiras entregas da fase "World of Lone Wolf", um spin-off da série
principal, não uma décima fase numérica.

## Contexto

Um novo diretório de conteúdo de nível superior apareceu: `world_of_lone_wolf/gsw/en/xhtml/gs/01gstw/`,
correspondendo ao placeholder que `PHASE_SECTIONS` (`books.ts`) já reservava desde antes ("World of Lone
Wolf (ainda não implementado)").

**Continuidade verificada primeiro**: leitura completa de `tssf.htm` confirmou que **não é uma
continuação** de nenhum livro já implementado — protagonista diferente (Grey Star, um mago Shianti da
Ilha de Lorn, não um Kai Lord), autoria diferente (conceito de Joe Dever e Gary Chalk, texto de Ian
Page, ilustrações de Paul Bonner, 1985 — um spin-off contemporâneo aos primeiros livros da série
principal, não uma sequência dela), numeração reiniciada no Livro 1, zero menção a carry-over. Reaproveita
termos de lore do universo compartilhado (Moonstone, Shadaki) mas é uma aventura autônoma — mesmo
tratamento dado ao Livro 21 (ADR-0007): `allowsCarryOver: false`, sempre desbloqueado na seleção.

Investigação profunda (leitura direta de `gamerulz.htm`, `powers.htm`, `equipmnt.htm`, `cmbtrulz.htm`, e
das próprias imagens `crtneg.png`/`crtpos.png`) confirmou que isto não é "mais um livro" — é um sistema
de personagem e combate genuinamente diferente. O usuário confirmou (perguntado diretamente, dado o
tamanho da mudança): implementação completa e fiel às regras originais, com arquitetura **paralela
isolada** (não integrar no `ActionChart` único já usado pelas 4 fases existentes).

## O que é diferente

- **3 atributos, não 2**: COMBAT SKILL (10+d10), **WILLPOWER** (20+d10, novo — sem teto, pode subir
  acima do inicial e cair abaixo de zero, gasto em magia/no Wizard's Staff), ENDURANCE (20+d10, com teto
  no inicial, igual ao padrão da série).
- **Combate com multiplicador de WILLPOWER**: o jogador escolhe quantos pontos de WILLPOWER gastar por
  rodada (mínimo 1, no máximo o que possui) ao usar o Wizard's Staff; o dano ao inimigo do CRT é
  **multiplicado** por esse número. Sem bônus de Disciplina — só penalidade de arma: 0 com o Staff
  equipado e WILLPOWER > 0, -6 sem isso (outra arma, ou o próprio Staff com WILLPOWER ≤ 0 — "you can
  still use your Wizard's Staff in combat as a normal weapon, but must deduct 6 points"), -8 desarmado.
- **"Magical Powers" (Lesser Magicks)**: 7 poderes fixos (Sorcery, Enchantment, Elementalism, Alchemy,
  Prophecy, Psychomancy, Evocation), escolhe 5 no início, **sem progressão nenhuma no livro** — diferente
  de toda fase Kai/Magnakai/Grand Master/New Order, que crescem com o rank. Alchemy concede um 3º
  container de inventário, o Herb Pouch (2 Empty Vials + Vial of Saltpetre + Vial of Sulphur,
  capacidade 8).
- **Equipamento fixo, não "escolha N de uma lista"**: kit fixo (Wizard's Staff, Backpack com 4 Meals, Map
  of the Shadakine Empire) + presente único escolha-1-de-3 (Jewelled Dagger +1 CS / Magic Talisman +2
  WILLPOWER único / Vial of Laumspur +4 ENDURANCE). Moeda ("Nobles") começa em 0 — "the system of money
  is alien to the Shianti" — só ganha matando inimigos.
- **Parser precisa de ajustes**: ilustrações usam `<div class="illustration">...<img alt="[illustration]"
  src="X.png"/>` (colchetes literais no `alt`, tiles decorativos têm `alt=""`) em vez de
  `<figure><img/></figure>`; o sanitizador descartava `<blockquote>`/`<ul>`/`<li>`/`<dl>`/`<dt>`/`<dd>`
  que estas seções usam de verdade; caminho de conteúdo usa `xhtml/gs/` em vez de `xhtml/lw/`; frontmatter
  em duas partes (`coming.htm` "Of the Coming of Grey Star" + `tssf.htm`), diferente de todo livro
  anterior.
- **CRT/RNT**: só existe como imagem, igual a toda a série. Verificado diretamente nas imagens de Grey
  Star: a coluna Combat Ratio=0 bate célula por célula com a reconstrução já usada em `crt.ts`
  (`BASE_ENEMY_LOSS_BY_ROLL`/`BASE_PLAYER_LOSS_BY_ROLL`). `getCombatResult` é reaproveitado sem mudança;
  a multiplicação por WILLPOWER entra depois do lookup, não dentro dele — inclui o mesmo aviso já
  documentado em `crt.ts` desde sempre ("interior cells may differ by a point or two from the printed
  book"), confirmado ao comparar contra o exemplo resolvido de `cmbtrulz.htm` (Combat Ratio -5, roll 6):
  a perda do jogador bate exatamente (4), a perda do inimigo antes do multiplicador reconstrói como 6 em
  vez do 5 do livro impresso — mesma categoria de discrepância de um-ou-dois-pontos já aceita pelos
  29 livros anteriores, não recalibrada aqui.
- 350 seções, final único em `sect350`, aponta pro Livro 2 da série Grey Star ("The Forbidden City",
  `gs/02tfc/`) — fora do escopo, mas confirma que o padrão de pastas (`gs/0Ncode/`) vai se repetir.

## Decisão: sistema paralelo isolado

Princípio geral: **nenhum arquivo/tipo/componente já usado pelos 29 livros existentes muda de
comportamento**. Toda mudança em infraestrutura compartilhada é estritamente aditiva — os 538 testes já
existentes continuaram passando inalterados durante toda a implementação.

### 1. `GreyStarActionChart` — tipo novo, não uma extensão de `ActionChart`

`app/src/engine/greyStarTypes.ts` define `GreyStarActionChart` do zero (combatSkill, willpowerCurrent
sem clamp, enduranceCurrent/Max, magicalPowers, weapons/equippedWeapon, backpackItems, herbPouchItems,
specialItems, nobles, currentSection, visitedSections, isAlive) — nenhum campo de `ActionChart`
(Disciplinas, Rank Kai, Arma Kai etc.) existe aqui, porque nenhum desses conceitos existe neste livro.

**Armas como `string[]`, não `WeaponType[]`**: a primeira versão usava o `WeaponType` compartilhado com
`WIZARDS_STAFF: WeaponType = 'Quarterstaff'`, mas isso teria dois problemas — reusar um valor existente
do enum não identifica unicamente o Staff (um Quarterstaff comum encontrado na aventura seria
indistinguível dele), e estender o enum compartilhado vazaria "Wizard's Staff" pro dropdown de armas do
`ActionChartSidebar.tsx` da série Lone Wolf, que nunca deveria saber que esse item existe. Corrigido
antes de qualquer código depender disso: `weapons`/`equippedWeapon` são `string[]`/`string | null` puros,
`WIZARDS_STAFF = "Wizard's Staff"` é uma constante de string solta.

**`GreyStarSpecialItem`, não `SpecialItem` importado**: para permitir que `types.ts` referencie
`GreyStarActionChart` (necessário pra `SaveGame`/`CampaignProgress`, ver seção 3) sem criar um import
circular de valor, `greyStarTypes.ts` define sua própria interface local (mesmo formato de
`SpecialItem`) em vez de importar de `./types`. Import circular *de tipo* (`types.ts` importando
`GreyStarActionChart` de volta) é seguro — apagado em tempo de compilação — mas evitar o ciclo de valor
elimina qualquer risco de ordem de inicialização de módulo.

### 2. Engine novo, reaproveitando só o que é genuinamente igual

- `greyStarInventory.ts`: mesmo estilo de `inventory.ts`, mas tipado pra `GreyStarActionChart`.
  Reaproveita `MAX_WEAPONS`/`MAX_BACKPACK_ITEMS` de `types.ts` sem mudança — os limites (2 armas, 8 itens
  de mochila) batem exatamente com `equipmnt.htm`. Herb Pouch (capacidade 8) é uma constante local, sem
  equivalente em `types.ts` porque só Grey Star tem esse container.
- `greyStarCharacter.ts`: `createFreshGreyStarCharacter` (rola CS/WP/EP, aplica o kit fixo — sem
  `bookEquipment.ts`, já que com um único livro nesta fase o kit fixo/gatilho de Alchemy/tabela de
  presente estão claros e diretos aqui mesmo, sem justificar uma config por-livro que só teria uma
  entrada), `chooseMagicalPowers` (valida exatamente 5 distintos, dispara o Herb Pouch se Alchemy estiver
  entre eles), `chooseStartingGift`.
- `greyStarCombat.ts`: `getEffectiveCombatSkill`/`canUseStaffMagic` (as 3 penalidades de arma),
  `resolveGreyStarCombatRound` — chama `getCombatResult` de `crt.ts` sem alteração, multiplica a perda do
  inimigo pelo gasto de WILLPOWER (mínimo 1, no máximo o disponível), deduz o gasto de `willpowerCurrent`
  sem clamp algum.

### 3. Persistência: tipos alargados, sem campo `kind`

`SaveGame.chart` e `CampaignProgress.completedBooks` foram alargados para `ActionChart |
GreyStarActionChart` — a discriminação em `App.tsx` usa `getBook(chart.bookId).phase ===
'world_of_lone_wolf'`, não um campo `kind` adicionado a qualquer um dos dois tipos (evita tocar
`ActionChart`, usado por todo o resto do app sem esperar esse campo). `persistence.ts` teve suas
assinaturas alargadas para o mesmo union (`type Chart = ActionChart | GreyStarActionChart | null`) — sem
nenhuma mudança de lógica interna, já que `localStorage`/JSON/fetch não têm conhecimento de tipo.
`SAVE_VERSION`: 8 → 9 (mudança de forma do save, mesmo padrão de todo bump anterior — sem migração).

### 4. UI paralela, componentes compartilhados só onde já eram agnósticos de fase

Novo par de telas (`GreyStarCharacterCreationScreen.tsx`, `GreyStarGameScreen.tsx`) e componentes
(`GreyStarActionChartSidebar.tsx`, `GreyStarCombatModal.tsx`) — `App.tsx` ramifica por
`getBook(activeBookId).phase === 'world_of_lone_wolf'` nos modos `create`/`playing`.

Confirmado por leitura direta de cada componente candidato: `BookIntroScreen.tsx`, `ChoiceList.tsx`,
`RandomNumberBranch.tsx` e `ManualSectionJump.tsx` já eram 100% agnósticos de tipo de ficha (só recebem
`book`/`choices`/`ranges`/callbacks genéricos) — reaproveitados sem nenhuma mudança. `ActionChartSidebar.tsx`
e `CombatModal.tsx`, por outro lado, são profundamente acoplados a `ActionChart` (Disciplinas,
`kaiName`, `WeaponType`, funções de `disciplines.ts`) — duplicar em vez de generalizar foi a escolha
certa: generalizar exigiria injetar toda a lógica de Disciplinas/Rank/Kai-blast atrás de branches
condicionais, tornando os dois sistemas mais difíceis de raciocinar sobre, pelo ganho de eliminar ~250
linhas que já não têm nenhuma superposição real de regras.

## Trade-offs considerados

- **Integrar no `ActionChart` único (rejeitado, opção não escolhida pelo usuário)**: manteria um único
  motor de personagem, mas exigiria poluir `ActionChart` com campos irrelevantes pra 29 dos 30 livros
  (WILLPOWER, Magical Powers, Herb Pouch) e teria arriscado regressão nas 4 fases já implementadas.
- **`greyStarBookEquipment.ts` separado, seguindo o padrão de `bookEquipment.ts` (rejeitado por ora)**:
  o plano original cogitava isso, mas com um único livro na fase o kit fixo cabe direto em
  `greyStarCharacter.ts` de forma mais legível: revisitar se/quando o Livro 2 (*The Forbidden City*)
  precisar de configuração por-livro. **Revisitado no Livro 2 — ver "Atualização — Livro 2" abaixo.**

## Consequências

- Zero mudança de comportamento nos 29 livros/4 fases já implementados — todos os 538 testes anteriores
  continuaram passando inalterados durante toda a implementação, mais os testes novos de
  `greyStarCharacter`/`greyStarCombat`/`parsedSections` (bloco `gsw`).
- `SAVE_VERSION` sobe pra 9 só pela forma alargada do save — nenhuma migração de saves antigos, mesmo
  padrão de todo bump anterior.
- Um segundo motor de personagem/combate para manter — aceito deliberadamente como o custo da fidelidade
  às regras genuinamente diferentes deste spin-off, e porque tentar unificar geraria mais acoplamento
  acidental do que economia real de código.
- Precedente estabelecido pra livros futuros da fase "World of Lone Wolf" (Grey Star 2-4, já confirmados
  existir na numeração `gs/0Ncode/`): reaproveitar `GreyStarActionChart`/`greyStarCombat.ts` enquanto as
  regras continuarem as mesmas, só generalizando (config por-livro, ex.) quando um livro futuro realmente
  divergir — mesmo critério de "não generalizar antes de ter 2 casos reais" já usado no resto do projeto.

## Atualização — Livro 2 (The Forbidden City)

O Livro 2 (*The Forbidden City*, `world_of_lone_wolf/acp/en/xhtml/gs/02tfc/`) é a segunda entrega da
mini-série Grey Star — mas, ao contrário do Livro 1 (uma entrada independente na história), **este é
uma continuação direta**: confirmado lendo `tssf.htm` na íntegra e comparando com a seção final do
Livro 1 (`gsw` `sect350`) — a seção 350 termina no meio da charada dos Kundi ("Wise Shianti and Kundi
man... But what does Kundi see?") e `sect1.htm` deste livro resolve essa mesma charada na primeira
frase ("Of course! ... The Kundi man would see himself!"). É a mesma cena, sem salto temporal.

### Carry-over de WILLPOWER — mecânica genuinamente nova, primeira vez fora das 4 fases Lone Wolf

`gamerulz.htm` confirma um carry-over real a partir do Livro 1, mas com uma mecânica sem equivalente em
Kai/Magnakai/Grand Master/New Order: o texto principal diz "add 10 to your WILLPOWER total", mas a
própria nota de rodapé 1 reconhece que isso "não parece justo" (WILLPOWER tende a estar baixo ao fim de
um livro, já gasto em magia) e oferece 2 alternativas — rolar um WILLPOWER novo (20+d10) + 10, ou usar
o WILLPOWER **inicial** do livro anterior (o valor rolado na criação, antes de qualquer gasto) + 10 —
deixando a escolha do método com o jogador. Isso exigiu um campo novo persistido,
`GreyStarActionChart.willpowerStarting` (a rolagem de criação, imutável durante toda a aventura,
distinto de `willpowerCurrent`) — `SAVE_VERSION`: 9 → 10.

A nova função `carryOverGreyStarCharacterToBook(previous, bookId, willpowerMethod, rng)` em
`greyStarCharacter.ts` calcula o novo WILLPOWER pelos 3 métodos e propaga tudo o mais (`combatSkill`,
`enduranceCurrent`/`Max`, `magicalPowers`, `weapons`, `backpackItems`, `herbPouchItems`,
`specialItems`, `nobles`) via spread, sem mudança — apesar do texto de `gamerulz.htm` só mencionar
literalmente "armas e Itens Especiais" no carry-over, a própria errata do livro (nota da seção 17, sobre
um Bundle of Azawood Leaves comprado no Livro 1 e usado neste livro) confirma na prática que Itens de
Mochila/Herb Pouch também sobrevivem — mesmo padrão de "carry-over completo" já usado por
`carryOverCharacterToBook` (`character.ts`) pras 4 fases Lone Wolf.

### Mais um Magical Power no carry-over

`gamerulz.htm`: "you may add 10 to your WILLPOWER total and choose one more Magical Power" — nova
função `addExtraMagicalPower(chart, power)` valida que o personagem tem exatamente 5 poderes (nunca
menos, nunca mais) e acrescenta o 6º, dos 2 que sobraram dos 7 totais. Se o poder novo for Alchemy e o
personagem ainda não tinha, ganha o Herb Pouch agora — a lista de 4 itens iniciais foi extraída pro
helper privado `grantHerbPouchStartingContents`, reaproveitado tanto por essa função nova quanto pela
`chooseMagicalPowers` já existente (evita duplicar a lista).

### `greyStarBookEquipment.ts` criado — a simplificação original da ADR revisitada

A ADR original deliberadamente não criou um arquivo de config por-livro (só havia 1 livro, o kit era
totalmente fixo). O Livro 2 introduziu a primeira diferença real: seu `equipmnt.htm` **não tem** a
tabela de presente único (Jewelled Dagger/Magic Talisman/Vial of Laumspur) que o Livro 1 tinha — aquele
presente era especificamente a despedida dos Mestres Shianti na Ilha de Lorn, só faz sentido na primeira
aventura. Criado `app/src/data/greyStarBookEquipment.ts`, deliberadamente muito mais simples que
`bookEquipment.ts` (só um booleano `grantsStartingGift`, sem `chooseOptions`/`kaiWeaponTable`/
`goldRollBonus` — o kit de Grey Star continua fixo em todo o resto).

### Zero mudança de parser — confirmado por comparação direta

Diferente do Livro 1 (que exigiu várias mudanças em `parseContent.ts`), o Livro 2 não precisou de
nenhuma: o conjunto de tags HTML usado nas 310 seções (`a, blockquote, br, cite, div, em, h3, i, img,
li, p, span, sup, table, tbody, td, tr, ul`) é **idêntico** ao já usado (e já aceito) pelo Livro 1 —
nenhuma tag nova, incluindo `cite`/`i`/`sup` que já eram degradadas pro texto puro desde o Livro 1. O
padrão de ilustração (`div.illustration img[alt="[illustration]"]`) é o mesmo. As imagens
`crtneg.png`/`crtpos.png` são **byte-idênticas** (md5 conferido) às do Livro 1 — `getCombatResult` de
`crt.ts` continua reaproveitado sem nenhuma mudança.

### UI: fluxo de criação de personagem ramificado por `creationMode`

`GreyStarCharacterCreationScreen.tsx` ganhou os mesmos props `creationMode`/`previousChart` já usados
por `CharacterCreationScreen.tsx` (par Lone Wolf) — fluxo fresco (rola atributos, escolhe 5 poderes,
presente condicional a `getGreyStarBookEquipment(book.id).grantsStartingGift`) ou fluxo de transferência
(sem rolagem, mostra CS/EP/WILLPOWER herdados, seletor dos 3 métodos de WILLPOWER, escolha do 6º poder).
`BookIntroScreen.tsx`'s prop `previousChart` foi alargado de `ActionChart | null` pra
`ActionChart | GreyStarActionChart | null` (mudança de tipo só — o componente só testa truthiness, não
lê campos específicos de nenhum dos dois tipos).

### Verificação do carry-over sem jogar 350 seções

Jogar o Livro 1 inteiro só pra testar o carry-over do Livro 2 não é prático. Verificado via Playwright
injetando um save sintético em `localStorage` (mesmo formato de `SaveGame`/`CampaignProgress` já usado
por `persistence.ts`) com uma entrada `gsw` completa — confirmado: tela de seleção mostra o Livro 1 com
"✓" e desbloqueia o Livro 2, a introdução oferece "Transferir personagem"/"Começar do zero", o fluxo de
transferência mostra os 3 métodos de WILLPOWER e só as 2 Magical Powers realmente restantes, e o
personagem resultante chega à Seção 1 do Livro 2 com os itens herdados (ex: Jewelled Dagger) intactos.

### Sem mudança de código de combate

Mecânica de combate inalterada (mesmas penalidades de arma, mesmo multiplicador de WILLPOWER) —
`greyStarCombat.ts` não precisou de nenhuma mudança, sem novos testes de combate.

## Atualização — Livro 3 (Beyond the Nightmare Gate)

O Livro 3 (*Beyond the Nightmare Gate*, `world_of_lone_wolf/bng/en/xhtml/gs/03btng/`) é a terceira
entrega da mini-série Grey Star — continuação direta do Livro 2, confirmada comparando `tfc` `sect310`
("Tanith stands before you... you step through") com `bng` `sect1` ("Tanith takes you by the hand and
you step forward...") — mesma cena, sem salto. Zero mudança de parser de novo (mesmo conjunto de tags,
mesmo padrão de ilustração, CRT byte-idêntico por md5), 350 seções, 28 becos sem saída, 0 puzzles.

### Uma segunda regra de carry-over de WILLPOWER, genuinamente diferente da do Livro 2

`gamerulz.htm` deste livro pede, literalmente, pra **re-rolar os 3 atributos do zero** mesmo num
personagem transferido — com o bônus de WILLPOWER escalando por progresso (+20 primeira aventura, +25
completou o Livro 1, +30 completou os Livros 1 e 2). A própria nota de rodapé 1 chama isso de "sem
precedente nos outros livros" e "aparenta ser um erro", recomendando a correção: manter COMBAT SKILL/
ENDURANCE do personagem transferido, só re-rolar o WILLPOWER (com o bônus correspondente) — sem os 3
métodos à escolha do jogador que o Livro 2 oferecia, aqui é uma rolagem automática sem escolha alguma.

Isso expôs um acoplamento indevido na primeira versão de `carryOverGreyStarCharacterToBook`: a função
calculava o WILLPOWER internamente a partir de um enum de 3 métodos específico do Livro 2, então não
tinha como expressar essa segunda regra sem inventar um 4º "método" artificial que não existe no livro.
**Refatorado**: a função central agora recebe o WILLPOWER **já calculado** (`newWillpower: number`) e só
faz o trabalho verdadeiramente comum (aplicar o valor, propagar o resto via spread, resetar seção/estado
de vida) — o cálculo de cada regra virou uma função pura própria (`computeThreeMethodWillpowerCarryOver`
pro Livro 2, `rollWillpowerForLaterBookCarryOver` pro Livro 3+), selecionada por um novo campo
`willpowerCarryOverMode` (`'threeMethods' | 'autoReroll'`) em `greyStarBookEquipment.ts`.

`rollWillpowerForLaterBookCarryOver` usa `magicalPowers.length` como proxy de progresso (6 = já passou
pela transferência 1→2, que sempre concede o 6º poder → bônus 30; 5 → bônus 25) em vez de consultar o
histórico completo de `campaign.completedBooks` — evita plumbing novo (passar `campaign` pra
`GreyStarCharacterCreationScreen`, que hoje só recebe o `previousChart` imediato) sem perder
corretude: como o desbloqueio de livros já exige completar o livro anterior, o caso "+20 primeira
aventura" nunca passa por esse caminho (só `createFreshGreyStarCharacter` cobre isso).

### "Escolha mais 1 Magical Power" não se repete a cada livro

`powers.htm`/nota de rodapé 5 confirma: o texto principal parece sugerir "escolher 6 de novo" a cada
livro, mas a nota reconhece que isso "não tem precedente" e recomenda a mesma correção já usada no Livro
2 — só um poder extra, **uma única vez na vida do personagem**. Como `addExtraMagicalPower` já exige
`magicalPowers.length === 5` pra funcionar, ela já bloqueia sozinha uma segunda aplicação em quem chega
ao Livro 3 com 6 poderes — nenhuma mudança nela, só a UI (`GreyStarCharacterCreationScreen.tsx`) passou a
esconder esse passo quando `previousChart.magicalPowers.length !== 5`.

### Sem mudança de equipamento fixo nem de combate

`equipmnt.htm` (nota de rodapé 7) confirma o carry-over completo de equipamento sem mudança — mesmo
padrão do Livro 2. Sem tabela de presente único (`grantsStartingGift: false`, igual ao Livro 2).
`cmbtrulz.htm` mecanicamente idêntico. Sem mudança de `SAVE_VERSION` — nenhum campo novo persistido,
só a refatoração da política de cálculo do WILLPOWER.
