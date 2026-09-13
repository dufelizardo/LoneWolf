# 0005 — Fase Magnakai: disciplinas separadas em vez de unificadas, e reset na fronteira de fase

## Status

**Implementada.** Livro 6 (*The Kingdoms of Terror*) jogável de ponta a ponta — primeiro livro da
fase Magnakai, distinta da fase Kai (Livros 1-5). Mergeado em `main` via PR, publicado via
`publish-image.yml`.

## Contexto

Um novo diretório de topo apareceu no repositório, `magnakai/tkt/en/xhtml/lw/06tkot/` — **fora**
de `kai/`, ao contrário de todo conteúdo anterior. Isso é o Livro 6 da série, e confirma o que a
ADR-0004 já sinalizava como pendência ("os '7 estágios' da série completa"): a série tem fases
acima do nível de livro, e a fase Kai (Livros 1-5) era só a primeira.

Investigando o conteúdo real (`equipmnt.htm`, `gamerulz.htm`, `discplnz.htm`, `cmbtrulz.htm`,
`levels.htm`), confirmei que a fase Magnakai não é uma extensão da fase Kai — é um sistema de jogo
paralelo e incompatível:

- As 10 Disciplinas Kai (Camouflage, Hunting, Sixth Sense, Tracking, Healing, Weaponskill,
  Mindshield, Mindblast, Animal Kinship, Mind Over Matter) são substituídas por 10 Disciplinas
  Magnakai completamente diferentes (Weaponmastery, Animal Control, Curing, Invisibility,
  Huntmastery, Pathsmanship, Psi-surge, Psi-screen, Nexus, Divination).
- **Não existe tabela de conversão.** Citação verbatim de `discplnz.htm`: *"After studying The Book
  of the Magnakai, you have also reached the rank of Kai Master Superior, which means that you have
  learnt three of the Magnakai Disciplines listed below. It is up to you to choose which three
  skills these are."* — o personagem simplesmente escolhe 3 livremente, não importa quais das 10
  Kai ele tinha.
- A escada de Rank também é outra, sem relação com a de Kai (Kai Master → Kai Master Senior → Kai
  Master Superior → ... → Kai Grand Master), começando em rank 3 com as 3 disciplinas iniciais.
- Psi-surge introduz o primeiro mecanismo de combate do motor com custo e escolha por rodada: +4
  Combat Skill por -2 Endurance (opcional, indisponível com Endurance ≤ 6), ou a alternativa
  gratuita "Mindblast" (+2 CS, sem custo) — mutuamente exclusivos por rodada.

## Decisão

### `disciplines: Discipline[]` fica intocado; novo campo irmão `magnakaiDisciplines`

Considerei três formas de modelar duas listas de disciplinas incompatíveis num `ActionChart`:

1. Unificar num union só de 20 nomes, um array.
2. Um array de objetos `{ phase, id }`.
3. Dois campos tipados separadamente (`disciplines: Discipline[]` + `magnakaiDisciplines:
   MagnakaiDiscipline[]`), cada um uma união estrita da fase certa.

Escolhi (3). As opções (1) e (2) quebram a garantia de compilação que `combat.ts`/`disciplines.ts`
já dependem (`chart.disciplines.includes('Hunting')` não aceita erro de digitação hoje), e forçariam
todo consumidor existente (usado em 6 lugares: `combat.ts` x3, `disciplines.ts` x2,
`ActionChartSidebar.tsx`, `CharacterCreationScreen.tsx`) a virar uma checagem por fase, para nenhum
ganho real sobre os Livros 1-5 já publicados. O custo de (3) é que uma terceira fase hipotética
precisaria de mais um campo + união — um trabalho mecânico pequeno, não um risco arquitetural.

### `carryOverCharacterToBook` zera Disciplinas Kai ao cruzar pra Magnakai

Como não existe conversão, um personagem carregado do Livro 5 pro Livro 6 não deveria manter suas
Disciplinas Kai — isso as deixaria dando bônus pra sempre nos livros Magnakai, o que é errado (a
fauna não tem tabela de conversão porque as duas listas não são pra coexistir). A alternativa seria
colocar uma checagem de fase (`getBook(bookId).phase === 'kai'`) na frente de cada bônus de
disciplina Kai em `combat.ts`/`disciplines.ts`, hoje e para sempre. Em vez disso, o reset acontece
uma única vez, no único lugar que já sabe que existe uma fronteira de fase
(`carryOverCharacterToBook`, comparando a fase do livro anterior com a do novo):

```ts
const crossingIntoMagnakai = getBook(bookId).phase === 'magnakai' && getBook(previous.bookId).phase !== 'magnakai';
// ...
disciplines: crossingIntoMagnakai ? [] : [...previous.disciplines],
weaponskillWeapon: crossingIntoMagnakai ? null : previous.weaponskillWeapon,
```

Depois disso, **um chart real nunca tem os dois arrays não-vazios ao mesmo tempo** — o que significa
que `combat.ts`/`disciplines.ts` não precisam de nenhuma consciência de fase: um simples
`chart.disciplines.includes('Healing') || chart.magnakaiDisciplines.includes('Curing')` já é seguro,
porque o `||` nunca vê os dois lados verdadeiros pra um mesmo personagem. `BookMeta` ganhou dois
campos pra isso — `contentRoot` (onde o conteúdo mora no disco) e `phase` (que regras valem) — mantidos
separados mesmo andando juntos hoje, porque são eixos conceitualmente diferentes.

### Psi-surge: bônus opcional por parâmetro, não um novo fluxo de combate

`getEffectiveCombatSkill`/`resolveCombatRound` ganharam um parâmetro opcional
`options: { usePsiSurge?: boolean }`, em vez de uma assinatura nova — nenhum call site nem teste
existente dos Livros 1-5 precisou mudar. `CombatModal.tsx` guarda a escolha num estado local
resetado a cada rodada (nunca "grudento", já que é uma decisão por rodada, não uma disciplina
permanente).

## Trade-offs considerados

**Dois campos tipados separados (escolhida)**
- ✅ Nenhuma checagem de fase precisa se espalhar por `combat.ts`/`disciplines.ts` — o reset na
  fronteira já garante mutual exclusão.
- ✅ Cada array continua 100% verificado em tempo de compilação contra o vocabulário certo.
- ❌ Uma terceira fase hipotética exige mais um campo + união — aceito, é mecânico, não arquitetural.

**Union unificado de 20 nomes ou array de objetos `{phase, id}` (rejeitadas)**
- ❌ Perdem a garantia de compilação contra erro de digitação nos 6 lugares que já fazem
  `.includes('NomeDaDisciplina')`.
- ❌ Forçariam todo consumidor existente a filtrar por fase, sem nenhum ganho sobre o código já
  publicado dos Livros 1-5.

**Guardar `phase` no `ActionChart` em vez de derivar de `getBook(chart.bookId).phase` (rejeitada)**
- ❌ Redundante e arriscaria dessincronizar depois de uma migração malfeita — a fase de um chart é
  sempre função do livro em que ele está, nunca precisa ser um fato guardado à parte.

## Consequências

**Positivas**
- Livro 6 jogável com as regras reais da série (sem conversão inventada), reaproveitando quase toda
  a arquitetura de registro por livro já validada em 5 livros anteriores.
- Estrutura pronta pro Livro 7 (mesma fase Magnakai) sem nenhuma mudança de fundamentos — só mais
  dados e o mecanismo "+1 disciplina" que os Livros 2-5 já usam pra Kai, agora espelhado pra
  Magnakai.

**Negativas / pendências**
- **Lore-circles** (`lorecrcl.htm`): 4 grupos de disciplinas que dão bônus de CS/EP extra se
  dominados simultaneamente — camada de bônus opcional, não bloqueia jogar o livro inteiro.
  Registrado como pendência real, não implementado agora.
- **Crescimento de `masteredWeapons`** (+1 arma dominada por livro Magnakai completado): só passa a
  importar a partir do Livro 7, já que não existe livro Magnakai anterior pra crescer a partir.
  `masteredWeapons` já existe e aceita exatamente 3 armas na criação do Livro 6; o mecanismo de
  incremento fica pro Livro 7.
- **"Improved Disciplines"** (`imprvdsc.htm`): o próprio livro diz que os detalhes "will be noted in
  future books" — nada a resolver agora, só uma pendência que os livros seguintes vão trazer.

## Atualização — Livro 7

O Livro 7 (*Castle Death*) chegou exatamente às duas pendências que este ADR tinha deixado
registradas, e confirma a terceira:

- **Crescimento do `masteredWeapons` implementado.** `discplnz.htm` do Livro 7 repete, byte a byte,
  a frase do Livro 6 sobre "+1 arma por livro Magnakai completado" — a diferença é que agora existe
  um livro Magnakai anterior pra crescer a partir. Adicionei `addExtraMasteredWeapon(chart, weapon)`
  como irmã de `chooseMasteredWeapons` (que continua exigindo exatamente 3, só na entrada na
  Disciplina), e a tela de criação de personagem passou a distinguir os dois casos: escolher
  Weaponmastery agora (3 do zero) vs. já ter Weaponmastery de um livro anterior (+1 arma, escolhida
  entre as ainda não dominadas). Fecha a issue #36/JOGOS-81.
- **Crescimento de Disciplina Magnakai confirmado, sem código novo.** `gamerulz.htm` do Livro 7
  declara pela primeira vez, de forma explícita, a regra "+1 Disciplina Magnakai por livro
  completado" — mas isso já era exatamente o que `addExtraMagnakaiDiscipline` fazia desde o Livro 6
  (o gatilho `baseChart.magnakaiDisciplines.length === 0` na tela de criação já cobria o caso). Achado
  confirmado por leitura direta do texto, não por suposição; nenhuma mudança de código necessária.
- **"Improved Disciplines" vira conteúdo real, e confirma ser puramente narrativo.** O rank
  "Primate" (rank 4) do Livro 7 já tem as 5 melhorias descritas (Animal Control, Curing, Huntmastery,
  Psi-surge, Nexus) — lidas na íntegra, nenhuma altera Combat Skill, Endurance ou qualquer efeito já
  modelado no motor (são flavor de história: repelir animal, atrasar veneno, escalar sem corda, etc).
  Mesma categoria dos achados anteriores de mecânica manual/narrativa — não exige código.

Nenhuma decisão de arquitetura nova neste livro: a mesma modelagem de dois campos separados
(`disciplines`/`magnakaiDisciplines`) e o mesmo reset na fronteira de fase seguem valendo sem
alteração.

## Atualização — Livro 8

O Livro 8 (*The Jungle of Horrors*) traz a primeira melhoria de "Improved Disciplines" com efeito
numérico real, não só narrativo:

- **Rank Tutelary (5 Disciplinas Magnakai) reduz a penalidade de combate desarmado.**
  `imprvdsc.htm` do Livro 8 declara, pra quem já possui Weaponmastery e chegou ao rank Tutelary: *"When
  entering combat without a weapon, you will lose only 2 points from your COMBAT SKILL, instead of
  the usual 4 points."* Isso é alcançável justamente neste livro (3 disciplinas iniciais + 2 de
  crescimento dos Livros 6-7 = 5). Implementado em `combat.ts` como uma segunda constante
  (`NO_WEAPON_PENALTY_TUTELARY = -2`), escolhida no lugar da penalidade padrão (`-4`) quando
  `magnakaiDisciplines.includes('Weaponmastery') && magnakaiDisciplines.length >= 5`. `kaiRank.ts` já
  tinha `Tutelary` na escada (`MAGNAKAI_RANKS[4]`) desde o começo da fase Magnakai — só nunca tinha
  sido alcançável/exercitado antes deste livro.
- As outras 4 entradas do rank Tutelary (Invisibility, Pathsmanship, Psi-screen, Divination) lidas na
  íntegra seguem puramente narrativas, sem números — mesma categoria do rank Primate do Livro 7.
- Quatro seções-quebra-cabeça (sect112, sect126, sect141, sect338) confirmam que o mecanismo
  `hasPuzzle` do Livro 5 também cobre o caso em que a seção tem uma escolha normal de fallback além do
  quebra-cabeça (diferente do padrão do Livro 7, onde as seções-quebra-cabeça também tinham
  fallback, mas o Livro 5 tinha uma seção só-quebra-cabeça sem fallback nenhum) — nenhuma mudança de
  parser foi necessária em nenhum dos três casos.
- Disciplinas Magnakai, regras de combate (fora a penalidade acima), escada de Rank e Lore-circles
  confirmados inalterados (diffs mostram só cosméticos de título/copyright).

Nenhuma decisão de arquitetura nova: é a primeira vez que uma melhoria de rank sai do território
"narrativo/sem código" e se torna uma regra numérica de verdade, mas o encaixe (uma condição a mais
dentro de `getEffectiveCombatSkill`) confirma que o modelo de campos separados + funções de
consulta simples segue suficiente sem precisar de nenhuma extensão estrutural.

## Atualização — Livro 9

O Livro 9 (*The Cauldron of Fear*) foi o primeiro livro Magnakai **puramente aditivo em dados** —
zero mudança de código de regras:

- **Rank Principalin (6 Disciplinas Magnakai) confirmado puramente narrativo.** Li `imprvdsc.htm` na
  íntegra: as 5 entradas (Animal Control, Invisibility, Huntmastery, Psi-surge, Nexus) descrevem só
  flavor de história (chamar animal, mascarar som, visão telescópica, confundir inimigo, apagar
  fogo) — nenhuma menciona Combat Skill, Endurance ou qualquer efeito já modelado no motor, ao
  contrário da entrada de Weaponmastery no rank Tutelary do Livro 8. Nenhuma mudança em `combat.ts`.
- Três seções-quebra-cabeça (sect115, sect204, sect241) repetem o padrão do Livro 8 — cada uma com
  uma escolha normal de fallback além do quebra-cabeça — confirmando de novo que `hasPuzzle` cobre
  esse formato sem nenhuma mudança de parser.
- Equipamento, disciplinas, regras de combate, escada de Rank e Lore-circles confirmados idênticos
  em substância aos do Livro 8 (diffs mostram só cosméticos de título/crédito de ilustrador/link de
  livro seguinte).

Nenhuma decisão de arquitetura nova, e nenhuma extensão de `combat.ts`/`disciplines.ts` — o livro
inteiro coube nos mecanismos genéricos por-livro (`books.ts`, `bookEquipment.ts`,
`SECTIONS_BY_BOOK`) já validados desde o Livro 6.

## Atualização — Livro 10

O Livro 10 (*The Dungeons of Torgar*) foi o primeiro livro Magnakai desde o Livro 6 a exigir um
campo novo em `ActionChart` — a sequência de livros puramente-aditivos-em-dados (7-9) acabou aqui:

### Poção de Alether: `combatPotionDoses` + toggle "pré-luta" no `CombatModal`

O 10º item de equipamento deixa de ser "3 Fireseeds" (idêntico nos Livros 7-9) e passa a ser a
**Potion of Alether**: *"will increase your COMBAT SKILL by +2 points when swallowed immediately
prior to a combat. It lasts for the duration of one combat only. There is enough for one dose."*
Confirmado via `errata.htm` que é intencional (harmonização com a Collector's Edition).

Isso é fundamentalmente diferente da Poção de Cura existente (`healingPotionDoses` +
`useHealingPotion`): a Poção de Cura tem efeito **instantâneo** ao ser usada (+4 Endurance na hora);
a de Alether tem um efeito que **persiste por uma luta inteira**, mas só é "comprada" uma vez.
Decisão de design: `useCombatPotion(chart)` (em `disciplines.ts`) só decrementa o dose — não aplica
nenhum efeito imediato, ao contrário de `useHealingPotion`. O bônus de +2 CS é aplicado em
`combat.ts` via um novo `CombatRoundOptions.useCombatPotion?: boolean`, mas ao contrário do
`usePsiSurge` (que é re-escolhido e re-pago a cada rodada), o `CombatModal` mantém esse flag `true`
em estado local (`potionActiveThisFight`) por toda a duração daquele combate assim que o jogador
marca o checkbox antes da primeira rodada — o dose só é gasto uma vez (na primeira rodada), não a
cada rodada. Essa é a primeira mecânica de combate do motor com essa forma "comprada uma vez, ativa
até o fim da luta", distinta tanto do "sempre ativo enquanto o item está no inventário" (Shield) 
quanto do "escolhido e pago a cada rodada" (Psi-surge).

`SAVE_VERSION` 5 → 6 (`ActionChart` ganha `combatPotionDoses`) — primeira mudança de save desde a
4→5 do Livro 6.

### Bônus de Weaponmastery+Bow/Mentora à Random Number Table: confirmado fora de escopo

O rank Mentora (7 Disciplinas Magnakai) tem uma entrada de Weaponmastery com regra numérica real:
*"When using a bow or thrown weapon and instructed to pick a number from the Random Number Table,
add 2 to the number picked if you are a Mentora with the Magnakai Discipline of Weaponmastery."*
Mas essa regra **estende** uma regra-base que já existe desde `discplnz.htm` do Livro 6 ("If you
have the Magnakai Discipline of Weaponmastery with Bow, you may add 3... from the Random Number
Table") e que **nunca foi implementada em nenhum dos 4 livros Magnakai anteriores** — confirmado por
grep que não existe nenhuma lógica de bônus-a-rolagem em `combat.ts`/`character.ts`, e que
`RandomNumberBranch.tsx` (o único lugar onde `rollRandomNumber` aparece pro jogador) resolve a
rolagem automaticamente contra faixas pré-calculadas da história, sem nenhum campo pro jogador
declarar um bônus. Decisão: manter esse comportamento — é o jogador que aplica o bônus mentalmente
quando a história pede uma rolagem, mesma categoria de auto-adjudicação manual já usada pra
Refeições e Flechas. Isso é uma pendência real desde o Livro 6, não algo que o Livro 10 introduziu;
registrado aqui só porque foi o livro que motivou a investigação a fundo.

### Resto do livro

Zero seções-quebra-cabeça (diferente dos Livros 8/9). Disciplinas Magnakai, `gamerulz.htm`,
`cmbtrulz.htm`, `levels.htm` e Lore-circles confirmados inalterados em substância.

## Atualização — Livro 11

O Livro 11 (*The Prisoners of Time*) — "o penúltimo episódio da saga Magnakai" segundo o próprio
texto — trouxe duas mudanças reais, uma de dados e uma de regra:

### Equipamento muda de forma (6-de-9, sem mapa)

Diferente dos Livros 7-10 (sempre "escolha 5 de 10", com um mapa concedido automaticamente),
`equipmnt.htm` do Livro 11 muda pra **"escolha 6 de 9"** (removendo Potion of Alether e 3 Fireseeds
da lista) e **não concede nenhum mapa** — confirmado por grep que não há nenhuma menção de "map of"
em `equipmnt.htm`, e explicado pela história: a queda pelo Shadow Gate do Livro 10 joga Lone Wolf
direto na Daziarn, um plano sobrenatural, não um território real pra mapear. `errata.htm` não
documenta nenhuma dessas mudanças como correção de digitalização — confirma que é o texto original.
Reaproveitado sem nenhuma mudança estrutural: `equipmentMode: 'choose-six'` já existia (usado desde
o Livro 4), e `applyBaseEquipment` simplesmente não chama `addSpecialItem` desta vez.

### Rank Scion-kai (8 Disciplinas Magnakai): segunda melhoria numérica de Weaponmastery, desta vez dupla

`imprvdsc.htm` do Livro 11 adiciona o rank Scion-kai, e sua entrada de Weaponmastery tem duas regras
numéricas simultâneas: *"Scion-kai may add 4 points (instead of the usual 3 points) to their COMBAT
SKILL [when armed with a mastered weapon]. Also, when in combat without a weapon they lose only 1
point from their COMBAT SKILL [instead of 2]."* Isso estende as DUAS regras já implementadas no
Livro 8 (penalidade desarmado) e desde o início da fase (bônus de arma dominada) com uma terceira
camada de rank. Implementado em `combat.ts` com duas constantes novas
(`WEAPONMASTERY_BONUS_SCION_KAI = 4`, `NO_WEAPON_PENALTY_SCION_KAI = -1`) e um novo limiar
(`SCION_KAI_DISCIPLINE_COUNT = 8`), checado **antes** do limiar de Tutelary em ambos os ramos (armado
e desarmado) — a ordem de checagem importa porque os limiares são cumulativos (8 disciplinas também
passa por >=5), mas o valor de Scion-kai deve vencer. `kaiRank.ts` já tinha `Scion-kai` na escada
(`MAGNAKAI_RANKS[7]`) desde o início da fase — só nunca tinha sido alcançável/exercitado antes deste
livro (exige 5 crescimentos de +1 disciplina, alcançáveis só depois de completar 5 livros Magnakai
anteriores).

As outras 4 entradas do rank Scion-kai (Invisibility, Pathsmanship, Psi-screen, Divination) lidas na
íntegra seguem puramente narrativas — mesmo padrão de todos os ranks anteriores.

Reconfirmado, ainda fora de escopo: o bônus de Weaponmastery+Bow à Random Number Table (ver
atualização do Livro 10) segue sem nenhuma implementação, e o Livro 11 não adiciona nada novo a essa
pendência.

### Resto do livro

Zero seções-quebra-cabeça. Disciplinas Magnakai, `gamerulz.htm`, `cmbtrulz.htm`, `levels.htm` e
Lore-circles confirmados inalterados em substância. Sem mudança de `SAVE_VERSION` — a melhoria de
Combat Skill é puramente derivada da contagem de Disciplinas, sem nenhum estado novo pra persistir.
