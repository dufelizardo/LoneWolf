# 0007 — Fase New Order: reaproveita o pool de Disciplinas Grand Master com base de rank deslocada

## Status

**Implementada.** Livros 21 (*Voyage of the Moonstone*) e 22 (*The Buccaneers of Shadaki*) jogáveis de
ponta a ponta — primeira e segunda entregas da fase New Order, sucedendo a fase Grand Master (Livros
13-20, completa).

## Contexto

Toda transição de fase anterior nesta série introduziu um sistema de Disciplinas **totalmente
paralelo** ao anterior:

- Kai → Magnakai (Livro 6): 10 Disciplinas Magnakai substituem por completo as 10 Disciplinas Kai —
  sem tabela de conversão, `disciplines`/`weaponskillWeapon` são zerados (ADR-0005).
- Magnakai → Grand Master (Livro 13): 12 Disciplinas Grand Master (10 upgrades nomeados + 2 novas)
  são adicionadas **em camada** sobre as Magnakai, com resolução "melhor camada vence" por mecanismo
  em vez de substituição total (ADR-0006).

A expectativa natural, ao investigar o Livro 21 ("New Order Kai Grand Master Disciplines" — o próprio
título de `discplnz.htm`), era encontrar mais um sistema novo. A investigação (leitura direta e na
íntegra de `discplnz.htm`, `equipmnt.htm`, `levels.htm`, `imprvdsc.htm`, `gamerulz.htm`, `kainame.htm`)
mostrou o contrário.

## Decisão

### 1. Reaproveitar `GrandMasterDiscipline` em vez de criar um tipo paralelo

`discplnz.htm` do Livro 21 lista 16 Disciplinas: as 12 já modeladas em `GrandMasterDiscipline`
(`GrandWeaponmastery`, `AnimalMastery`, `Deliverance`, `Assimilance`, `GrandHuntmastery`,
`GrandPathsmanship`, `KaiSurge`, `KaiScreen`, `GrandNexus`, `Telegnosis`, `MagiMagic`, `KaiAlchemy`) —
com os mesmos números, confirmados idênticos em `cmbtrulz.htm` (Kai-surge +8 CS/-1 EP, Grand
Weaponmastery +5 CS, etc.) — mais 4 inteiramente novas: `Astrology`, `Herbmastery`, `Elementalism`,
`Bardsmanship`. As 4 novas são lidas na íntegra em `imprvdsc.htm`/`discplnz.htm` e são **puramente
narrativas**, sem nenhum número de Combat Skill/Endurance.

Dado que os números e mecanismos são idênticos onde já existem, o tipo `GrandMasterDiscipline` foi
**estendido** com as 4 novas em vez de duplicado — `ActionChart.grandMasterDisciplines` continua sendo
o único array, usado tanto no Grand Master quanto no New Order.

### 2. Contagem inicial configurável, não mais hardcoded em 4

`applyGrandMasterDisciplines` exigia "exatamente 4" fixo. O Livro 21 exige exatamente 5
(*"Your present rank of Kai Grand Master Senior means that you have mastered five of the New Order
Grand Master Disciplines"*). A função ganhou um parâmetro `expectedCount = 4`, e `BookMeta` ganhou
`initialDisciplineCount?: number` (só setado no Livro 13, implícito 4, e no Livro 21, setado 5) — o
mecanismo do bônus permanente (+1 CS/+2 EP por Disciplina extra além da contagem inicial,
`addExtraGrandMasterDiscipline`) não mudou, só a frase-base do "além de quantas" varia por fase.

### 3. Rank recalculado com uma base diferente — achado central desta ADR

`levels.htm` do Livro 21 lista a **mesma escada de 12 nomes** já em `GRAND_MASTER_RANKS` (`Kai Grand
Master Senior` → ... → `Kai Supreme Master`), mas o texto declara explicitamente: *"Your present rank
of Kai Grand Master Senior... (You begin the New Order adventures at this level of Kai Grand
Mastery)"* — ou seja, um personagem **novo** do Livro 21, com 5 Disciplinas, deve mostrar rank **"Kai
Grand Master Senior"** (a PRIMEIRA posição da escada), não "Kai Grand Guardian" (5ª posição), que é o
que a fórmula antiga (`GRAND_MASTER_RANKS[disciplineCount - 1]`, implicitamente base 1) produziria.

Isso não é uma ambiguidade — o texto fonte é explícito — mas exige uma fórmula genuinamente diferente
da usada no Grand Master. `getGrandMasterRank` ganhou um parâmetro `baseline = 1`
(`index = disciplineCount - baseline`, clampado): o Grand Master continua com base 1 (contagem 4 →
índice 3 → "Kai Grand Defender", como sempre), e o New Order usa base 5 (contagem 5 → índice 0 →
"Kai Grand Master Senior"). `getRankForChart` ganhou um ramo pra `phase === 'new_order'` chamando essa
mesma função com base 5.

**Dívida técnica registrada, não resolvida agora**: os limiares numéricos em `combat.ts`
(`SUN_LORD_DISCIPLINE_COUNT=7`, `GRAND_CROWN_DISCIPLINE_COUNT=10`, `SUN_PRINCE_DISCIPLINE_COUNT=11`)
são contagens brutas de Disciplinas, calibrados pra base 1 do Grand Master. Como o New Order usa base
5, os MESMOS números brutos não corresponderiam aos ranks equivalentes nessa fase nova (ex: o
equivalente de "Sun Lord" no New Order seria contagem bruta 11, não 7). Isso não afeta o Livro 21 (o
máximo alcançável nele é 5 Disciplinas, bem abaixo de qualquer limiar) — fica para quando um livro
New Order futuro introduzir conteúdo numérico de rank alto.

### 4. Sem carry-over do Livro 20 — novo campo `BookMeta.allowsCarryOver`

`gamerulz.htm` do Livro 21 rola Combat Skill e Endurance do zero, sem nenhuma referência a importar a
Ficha de Aventura do Livro 20 — diferente das transições Kai→Magnakai e Magnakai→Grand Master, que
têm regras de carry-over explícitas nos seus próprios `gamerulz.htm`. A lógica genérica em `App.tsx`
("livro anterior = o de `order - 1` que já foi completado") ofereceria incorretamente a opção
"Transferir personagem" pro Livro 21, produzindo um personagem com CS/EP importados que o livro nunca
pretendeu. Novo campo `BookMeta.allowsCarryOver` (default `true`, `false` só no Livro 21) faz a busca
de `previousChart` retornar `null` sempre que o livro-alvo não permite transferência, sem tocar em
`BookIntroScreen.tsx`/`CharacterCreationScreen.tsx` (que já tratam `previousChart === null` como
"personagem novo" desde sempre).

**Atualização (feedback do usuário)**: `allowsCarryOver: false` também passou a **destravar** o livro
na tela de seleção, independente do livro anterior estar completo — mesmo tratamento já dado ao Livro
1. Raciocínio: um livro que não aceita transferência de personagem nenhum é, por definição, um ponto
de entrada autônomo na história (o Livro 21 conta a história "depois dos 20 livros", mas não depende
de tê-los jogado) — faz sentido que o jogador possa pular direto pra ele sem completar a cadeia
inteira antes. `BookSelectionScreen.tsx`'s `unlocked` agora é `index === 0 || book.allowsCarryOver ===
false || (livro anterior completo)`.

### 5. Nome Kai — novo campo persistente, primeira vez na série

`kainame.htm` (confirmado, via diff completo de todos os arquivos do Livro 21 contra o Livro 20, como
o único arquivo genuinamente novo) introduz um passo de nomear o personagem — livre ou sorteado de
duas tabelas de 10 entradas (prefixo + sufixo). Isso exige um campo novo persistente
(`ActionChart.kaiName: string`, vazio para toda fase anterior), e portanto um bump de `SAVE_VERSION`
(7 → 8) — sem migração de saves antigos, mesmo padrão já usado em toda mudança de campo anterior.

### 6. Arma Kai — bônus que soma, não substitui

`equipmnt.htm` introduz a Kai Weapon Table (10 armas nomeadas, escolhida ou sorteada), com um bônus
base de +5 Combat Skill enquanto equipada. Texto confirmado: *"If you possess the Discipline of Grand
Weaponmastery for a weapon type which is the same as your unique Kai Weapon, you may add the Grand
Weaponmastery bonus of +5... This is in addition to the bonus gained when you use your Kai Weapon in
combat."* — ou seja, os dois bônus **somam** (+10 no total) quando o tipo bate, ao contrário do padrão
"melhor camada vence" já usado pra outros bônus de arma (ADR-0006). Por isso o bônus da Arma Kai foi
modelado com um campo próprio (`kaiWeaponType: WeaponType | null`, gate em `equippedWeapon ===
kaiWeaponType`) em vez de reaproveitar o mecanismo incondicional `SPECIAL_ITEM_COMBAT_BONUS` — que
aplicaria o bônus sempre, mesmo com outra arma equipada.

Cada Arma Kai também tem um bônus situacional maior (+6 a +9 CS) contra um tipo de inimigo/condição
específico (ex: "+7 contra mortos-vivos") — **não implementado**: o motor não modela tipo/condição de
inimigo de forma estruturada em lugar nenhum, mesma categoria de pendência do bônus de
Weaponmastery+Bow (aberto desde o Livro 6).

## Trade-offs considerados

- **Sistema de Disciplinas paralelo (rejeitado)**: seguiria o padrão de toda transição anterior, mas
  seria trabalho redundante e uma fonte de bugs de sincronização — os números realmente são idênticos
  onde já existem, confirmado por leitura direta, não por suposição.
- **Ignorar a base de rank deslocada e aceitar "Kai Grand Guardian" como rank inicial (rejeitado)**:
  mais simples de implementar, mas contradiz o texto fonte explicitamente — o próprio livro diz "you
  begin at this level" apontando pro primeiro nome da lista.

## Consequências

- Fase Grand Master e fase New Order compartilham `GrandMasterDiscipline`, `combat.ts`,
  `chooseGrandMasteredWeapons`/`addExtraGrandMasteredWeapon` sem duplicação de código.
- `getGrandMasterRank`/`applyGrandMasterDisciplines` agora são genéricas (aceitam baseline/contagem),
  em vez de hardcoded pro Grand Master — generalização mínima, sem quebrar nenhum teste existente
  (baseline 1 e contagem 4 continuam os defaults).
- Dívida técnica registrada (não resolvida): limiares de `combat.ts` pra bônus numéricos de rank alto
  não são baseline-aware — só importa quando/se um livro New Order futuro introduzir conteúdo
  numérico nesse patamar.
- `SAVE_VERSION` sobe pra 8 só por causa do Nome Kai — nenhuma outra mudança desta ADR toca dado
  persistido (Arma Kai reaproveita `specialItems` + um campo simples, contagens/rank são derivados).

## Atualização — Livro 22

O Livro 22 (*The Buccaneers of Shadaki*) é a segunda entrega da fase New Order, e — diferente do Livro
21, que era o abridor de fase sem nenhum carry-over — **tem um caminho de carry-over normal e explícito**
a partir do Livro 21, confirmado em `gamerulz.htm`: mantém CS/EP, Itens Especiais, Arma Kai, Nome Kai,
Armas normais e Itens de Mochila, e ganha +1 Disciplina Grand Master (+1 CS/+2 EP). Início do zero
direto no Livro 22 também é suportado (`discplnz.htm` confirma a mesma exigência de 5 Disciplinas
iniciais do Livro 21).

Investigação (leitura direta de `discplnz.htm`, `equipmnt.htm`, `imprvdsc.htm`, `gamerulz.htm`,
`kainame.htm`, e diff de arquivos contra o Livro 21) confirmou que **nenhuma arquitetura nova foi
necessária** — só dados novos (`books.ts`, `bookEquipment.ts`), com uma exceção real: um bug de UI.

- **Nenhuma Disciplina nova**: mesmo pool de 16 do Livro 21. Nenhuma mudança em `types.ts`.
- **Confirmação cruzada da fórmula de rank base 5**: `imprvdsc.htm` do Livro 21 era um stub vazio;
  no Livro 22 tem conteúdo real pela primeira vez, exatamente no rank "Kai Grand Master Superior" (6
  Disciplinas = 5 iniciais + 1 do carry-over) — a mesma posição que `getGrandMasterRank(6, 5)` já
  produzia antes desta confirmação existir. Validação independente da arquitetura, não uma mudança
  nela.
- **Tabelas de Nome Kai e de Arma Kai são byte-idênticas** às do Livro 21 (confirmado por leitura
  linha a linha de ambos os `kainame.htm`/`equipmnt.htm`) — nenhuma tabela precisou virar dado
  por-livro, `KAI_NAME_PREFIXES`/`KAI_NAME_SUFFIXES` continuam constantes compartilhadas.
- **Bug real encontrado e corrigido**: `needsKaiWeapon` em `CharacterCreationScreen.tsx` checava
  apenas `equipmentConfig.kaiWeaponTable !== undefined`, sem checar se o personagem já tinha uma Arma
  Kai. Como o Livro 22 também define `kaiWeaponTable` (pra suportar início do zero), um personagem
  carregado do Livro 21 (já com `kaiWeaponType` preenchido) seria incorretamente questionado de novo —
  contradizendo `equipmnt.htm`: *"If you have completed the previous... adventure, you already possess
  a Kai Weapon."* Corrigido para `equipmentConfig.kaiWeaponTable !== undefined && !isCarryOver`, o
  mesmo padrão já usado por `needsKaiName` desde o Livro 21.
- **Dívida técnica dos limiares de `combat.ts` ainda não se aplica**: o máximo de Disciplinas
  alcançável no Livro 22 é 6 (carry-over do Livro 21), bem abaixo do primeiro limiar
  (`SUN_LORD_DISCIPLINE_COUNT = 7`). Continua registrada, não resolvida, para quando um livro New
  Order futuro ultrapassar esse ponto.
- Sem mudança de `SAVE_VERSION` — nenhum campo novo persistente.
