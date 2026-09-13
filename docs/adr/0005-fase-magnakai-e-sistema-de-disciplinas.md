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
