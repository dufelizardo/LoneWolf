# 0008 — Fase World of Lone Wolf: sistema de personagem/combate paralelo isolado ("Grey Star the Wizard")

## Status

**Implementada.** Livro 1 (*Grey Star the Wizard*) jogável de ponta a ponta — primeira entrega da fase
"World of Lone Wolf", um spin-off da série principal, não uma décima fase numérica.

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
  precisar de configuração por-livro.

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
