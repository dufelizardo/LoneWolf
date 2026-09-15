# 0007 — Fase New Order: reaproveita o pool de Disciplinas Grand Master com base de rank deslocada

## Status

**Implementada.** Livros 21 (*Voyage of the Moonstone*), 22 (*The Buccaneers of Shadaki*), 23
(*Mydnight's Hero*), 24 (*Rune War*), 25 (*Trail of the Wolf*), 26 (*The Fall of Blood Mountain*) e 27
(*Vampirium*) jogáveis de ponta a ponta — sete primeiras entregas da fase New Order, sucedendo a fase
Grand Master (Livros 13-20, completa).

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

**Dívida técnica registrada nesta seção — resolvida no Livro 23, ver "Atualização — Livro 23" abaixo**:
os limiares numéricos em `combat.ts` (`SUN_LORD_DISCIPLINE_COUNT=7`, `GRAND_CROWN_DISCIPLINE_COUNT=10`,
`SUN_PRINCE_DISCIPLINE_COUNT=11`) eram contagens brutas de Disciplinas, calibradas pra base 1 do Grand
Master. Como o New Order usa base 5, os MESMOS números brutos não corresponderiam aos ranks
equivalentes nessa fase nova (ex: o equivalente de "Sun Lord" no New Order seria contagem bruta 11, não
7). Isso não afetou os Livros 21 e 22 (máximo de 5 e 6 Disciplinas respectivamente, abaixo de qualquer
limiar) — mas o Livro 23 permite chegar a 7 (via dois carry-overs sequenciais), disparando o problema de
fato.

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

## Atualização — Livro 23

O Livro 23 (*Mydnight's Hero*) é a terceira entrega da fase New Order, com carry-over normal a partir
do Livro 22 (`gamerulz.htm` do Livro 23 até formaliza que o carry-over vale "de qualquer um dos livros
anteriores da série" — Livros 21 ou 22 — mas como o desbloqueio do app já exige ter completado o livro
imediatamente anterior pra acessar o próximo, esse cenário de "pular direto do 21 pro 23" nunca ocorre
na prática: quem chega ao Livro 23 sempre completou o 22 antes).

### Confirmação cruzada do rank "Kai Grand Sentinel"

`imprvdsc.htm` ganha um novo patamar de conteúdo real: **Kai Grand Sentinel** (melhorias narrativas
para Grand Weaponmastery, Grand Pathsmanship, Astrology, Herbmastery, Elementalism e Bardsmanship,
nenhuma com bônus numérico). Um personagem que completou os Livros 21 e 22 sequencialmente chega ao
Livro 23 com 7 Disciplinas Grand Master (5 iniciais + 1 + 1), e `getGrandMasterRank(7, 5)` já produzia
o índice 2 — `'Kai Grand Sentinel'` — antes mesmo dessa confirmação existir. Mais uma validação
independente da arquitetura de base 5, sem exigir nenhuma mudança de código.

### Bug real corrigido: limiares de `combat.ts` agora baseline-aware

A dívida técnica registrada na seção 3 acima ("Rank recalculado com uma base diferente") deixou de ser
hipotética neste livro: **7 Disciplinas Grand Master é exatamente o valor bruto que `combat.ts` usava
como limiar de rank Sun Lord** (`SUN_LORD_DISCIPLINE_COUNT = 7`), calibrado implicitamente pra base 1
do Grand Master. Um personagem New Order chegando ao Livro 23 com 7 Disciplinas (via dois carry-overs
sequenciais) e que tivesse escolhido Kai-surge seria incorretamente tratado por `canUseKaiBlast` como
tendo alcançado o rank Grand-Master-fase "Sun Lord" — ganhando acesso ao Kai-blast, uma habilidade de
dano de 2-18 pontos que substitui o round inteiro — quando na real escada de rank do New Order (base 5)
7 Disciplinas equivale apenas a "Kai Grand Sentinel", um rank bem mais baixo sem nenhuma habilidade de
combate especial nova. O mesmo problema afetava o bônus de fogo do Grand Weaponmastery (Sun Lord), o
bônus desarmado do Grand Weaponmastery (Grand Crown) e o Kai-ray (Sun Prince) — todos comparavam a
contagem bruta de Disciplinas contra um valor fixo, sem considerar a fase/base do livro.

**Correção**: os três limiares viraram índices de posição no array `GRAND_MASTER_RANKS` (compartilhado
entre as fases Grand Master e New Order) em vez de contagens brutas — `SUN_LORD_RANK_INDEX = 6`,
`GRAND_CROWN_RANK_INDEX = 9`, `SUN_PRINCE_RANK_INDEX = 10` — comparados contra
`chart.grandMasterDisciplines.length - getGrandMasterBaseline(chart)`. `getGrandMasterBaseline`
(nova função exportada de `kaiRank.ts`) extrai a mesma lógica de baseline já usada internamente por
`getRankForChart` (5 pra `new_order`, 1 pra qualquer outra fase), evitando duplicação. Pra fase Grand
Master (base 1), o comportamento é idêntico a antes (`length - 1 >= 6` ⟺ `length >= 7`) — os testes
existentes de Sun Lord/Grand Crown/Sun Prince continuam passando inalterados. Pra New Order (base 5),
o limiar de Sun Lord passa a ser corretamente 11 Disciplinas brutas, não 7 — só quem realmente alcançar
o rank "Sun Lord" na escada compartilhada ganha as habilidades correspondentes.

### O que mais é igual (sem mudança de arquitetura)

- Nenhuma Disciplina nova, mesmo pool de 16.
- Tabela de Arma Kai e tabelas de Nome Kai byte-idênticas aos Livros 21/22.
- Equipamento: mesma lista de 10 itens, escolha 5, mesmo ouro/mochila — só muda o mapa automático
  (`'Map of Central Southern Magnamund'`).
- Sem mudança de `SAVE_VERSION` — nenhum campo novo persistente.

## Atualização — Livro 24

O Livro 24 (*Rune War*) é a quarta entrega da fase New Order. **Critério usado para confirmar que é uma
continuação, não uma aventura nova**: leitura de `tssf.htm` — a abertura ("the sleek royal Siyenese
clipper glided into Holmgard harbour") retoma literalmente a cena final do `sect350` do Livro 23
(retorno a Holmgard após a sucessão de Karvas), antes de introduzir a nova missão. Esse é o teste que
deve ser aplicado a cada novo livro da fase: só um livro cujo `tssf.htm` **não** retoma a cena final do
anterior (como o Livro 21, que rola CS/EP do zero sem qualquer referência ao Livro 20) justifica
`allowsCarryOver: false`. Livro 24 confirma o padrão normal: `gamerulz.htm` mantém a linguagem "de
qualquer um dos livros anteriores (21-23)" já vista no Livro 23, sem mudança de mecanismo.

### Confirmação cruzada do rank "Kai Grand Defender"

`imprvdsc.htm` ganha o próximo patamar de conteúdo real: **Kai Grand Defender** (melhorias narrativas
pra Deliverance, Telegnosis, Astrology, Herbmastery, Elementalism, Bardsmanship, sem bônus numérico).
Um personagem que completou os Livros 21, 22 e 23 sequencialmente chega ao Livro 24 com 8 Disciplinas
Grand Master, e `getGrandMasterRank(8, 5)` já produzia o índice 3 — `GRAND_MASTER_RANKS[3]` = `'Kai
Grand Defender'` — antes mesmo dessa confirmação existir. A dívida técnica dos limiares de `combat.ts`
(resolvida neste mesmo livro, ver abaixo) continua sem disparar aqui: 8 Disciplinas está bem abaixo do
limiar de Sun Lord ajustado pra base 5 (11).

### Primeira lista de equipamento genuinamente diferente desde o Livro 21

Todo livro anterior da fase New Order (21-23) reaproveitava a mesma lista de 10 itens de equipamento
(só o mapa automático mudava). O Livro 24 troca 2 itens pela primeira vez: Quarterstaff sai, Broadsword
entra; Flute sai, Lute entra (mesmas categorias, mesma ausência de efeito mecânico — Lute é só um Item
de Mochila, igual toda Flute anterior). Isso confirma que `bookEquipment.ts` precisa continuar sendo
uma entrada por livro (não uma constante compartilhada) mesmo dentro da mesma fase — decisão que já era
a arquitetura usada, sem mudança necessária.

### Peculiaridade de conteúdo encontrada: finais "vitória pírrica" sem a classe `deadend`

4 seções (42, 111, 267, 300) narram a morte do personagem **depois** de cumprir a missão ("you have
paid for with your life") — mecanicamente equivalentes a um beco sem saída (o personagem não sobrevive
pra continuar a campanha) — mas o HTML de origem não marca essas seções com `class="deadend"` como
todo outro final de morte da série. Sem escolhas e sem a marcação de puzzle, o parser as classifica
como `isEnding`. **Não é um bug do motor**: `GameScreen.tsx` já trata qualquer `isEnding` que não seja
a seção final canônica do livro como derrota (`onGameOver('deadend')`), o mesmo mecanismo documentado
desde antes pra finais não-canônicos como `tck sect61`. Só documentado em teste (`parsedSections.test.ts`),
sem mudança de código.

## Atualização — Livro 25

O Livro 25 (*Trail of the Wolf*) é a quinta entrega da fase New Order — continuação direta confirmada
via `tssf.htm` (retoma literalmente a notícia do desaparecimento de Lone Wolf, final do Livro 24), mesmo
critério usado desde a atualização do Livro 24.

### Confirmação cruzada do rank "Kai Grand Guardian"

`imprvdsc.htm` ganha o próximo patamar de conteúdo real: **Kai Grand Guardian** (índice 4 do array
`GRAND_MASTER_RANKS`). Um personagem que completou os Livros 21-24 sequencialmente chega ao Livro 25
com 9 Disciplinas Grand Master, e `getGrandMasterRank(9, 5)` já produzia esse rank antes mesmo dessa
confirmação existir.

### Reconfirmação da pendência do Kai-surge de 3 inimigos simultâneos (issue #61/JOGOS-92)

A entrada de Kai-surge no rank Kai Grand Guardian repete **literalmente o mesmo texto** já registrado
na ADR-0006 pro Livro 14 (fase Grand Master, mesmo índice de rank): *"able to attack up to three
enemies in psychic combat simultaneously"* — sem detalhar a resolução mecânica (dano de volta
simultâneo de todos os 3? Combat Ratio calculado uma vez contra os 3 ou uma vez por inimigo?). Nenhuma
informação nova surge aqui pra resolver a ambiguidade de design já registrada — a pendência permanece
deliberadamente não implementada, mesma categoria do bônus de Weaponmastery+Bow (pendente desde o
Livro 6). Esta é a primeira vez que essa pendência reaparece na fase New Order, confirmando que ela é
uma característica do rank "Kai Grand Guardian" em si (compartilhado entre as duas fases via
`GRAND_MASTER_RANKS`), não uma peculiaridade isolada do Livro 14.

### Equipamento: Flute volta a substituir a Lute

O Livro 24 havia trocado Flute por Lute (mesma categoria, mesma ausência de efeito). O Livro 25 reverte
essa troca especificamente — Flute volta à lista, mas Broadsword (também introduzido no Livro 24)
permanece, Quarterstaff não retorna. Confirma que a lista de equipamento de cada livro precisa ser lida
integralmente a cada nova entrega, sem assumir "reaproveita o livro anterior" nem "reaproveita o livro
anterior ao anterior" — cada `equipmnt.htm` é a fonte de verdade.

### Sem mudança de código

Nenhuma Disciplina nova, nenhuma mudança de mecânica de combate, nenhum novo limiar em `combat.ts`
disparado (9 Disciplinas, base 5, está bem abaixo do limiar de Sun Lord ajustado, 11). Sem mudança de
`SAVE_VERSION`.

## Atualização — Livro 26

O Livro 26 (*The Fall of Blood Mountain*) é a sexta entrega da fase New Order.

### Critério de continuação refinado: `gamerulz.htm`, não a estrutura do `tssf.htm`

Diferente dos Livros 22-25 (cujo `tssf.htm` sempre retomava literalmente a cena final do livro
anterior), o `tssf.htm` deste livro introduz um salto temporal — "a year has elapsed since your
triumph at Gazad Helkona... it has been a peaceful and rewarding time... training new recruits" —
antes de apresentar a nova missão via Lord Rimoah, referenciando os Livros 24 e 25 por meio de notas
de rodapé (eventos passados), não como continuação imediata de cena. Isso levantou a dúvida se seria
um ponto de entrada novo (como o Livro 21).

**Resolvido lendo `gamerulz.htm` diretamente**, que confirma o carry-over normal de sempre: *"If you
have successfully completed previous adventures in the Lone Wolf New Order series (Books 21–25), you
can carry your current scores..."* — idêntico ao mecanismo já implementado. **Critério refinado pra
decidir `allowsCarryOver` em livros futuros**: o teste decisivo não é "o `tssf.htm` retoma a cena exata
do final anterior" (esse sinal narrativo pode variar por causa de saltos temporais legítimos na
história, como aqui), e sim **"o `gamerulz.htm` ainda descreve o carry-over normal com base nos livros
anteriores da série"** — esse é o teste mecânico que realmente determina o comportamento do app. O
Livro 21 continua sendo o único caso de `allowsCarryOver: false` porque foi o único cujo `gamerulz.htm`
não menciona nenhum carry-over.

### Confirmação cruzada do rank "Sun Knight"

`imprvdsc.htm` ganha o próximo patamar de conteúdo real: **Sun Knight** (índice 5 do array
`GRAND_MASTER_RANKS`) — 8 melhorias narrativas, nenhuma com bônus numérico. Um personagem que completou
os Livros 21-25 sequencialmente chega ao Livro 26 com 10 Disciplinas Grand Master, e
`getGrandMasterRank(10, 5)` já produzia esse rank antes mesmo dessa confirmação existir.

### Equipamento reordenado, sem troca de item

Ao contrário dos Livros 24 e 25 (que trocaram itens de fato — Quarterstaff↔Broadsword, Flute↔Lute), o
Livro 26 mantém exatamente os mesmos 10 itens do Livro 25, só reordenados na página (Broadsword listado
primeiro). Primeira vez na fase New Order sem nenhuma seção-quebra-cabeça.

### Sem mudança de código

Nenhuma Disciplina nova, nenhuma mudança de mecânica de combate. 10 Disciplinas (base 5) está a apenas
1 Disciplina do limiar de Sun Lord ajustado (11) — vale conferir no próximo livro se esse limiar
finalmente é alcançável por um personagem totalmente sequencial. Sem mudança de `SAVE_VERSION`.

## Atualização — Livro 27

O Livro 27 (*Vampirium*) é a sétima entrega da fase New Order — continuação confirmada pelo mesmo
critério do Livro 26 (`gamerulz.htm` descreve carry-over normal, apesar de outro salto temporal no
`tssf.htm`, "Three months after you returned from Bor...").

### Validação real do rank "Sun Lord" — primeira vez que um limiar numérico é alcançado na fase New Order

`imprvdsc.htm` ganha o próximo patamar: **Sun Lord** (índice 6 do array `GRAND_MASTER_RANKS`). Um
personagem que completou os Livros 21-26 sequencialmente chega ao Livro 27 com **11 Disciplinas Grand
Master** — exatamente o limiar ajustado pra base 5 que `SUN_LORD_RANK_INDEX` em `combat.ts` já usava
desde a correção do Livro 23 (`disciplineCount - getGrandMasterBaseline(chart) >= 6` ⟺ `11` Disciplinas
brutas pra New Order).

**Isso é significativo**: diferente dos ranks anteriores (Sentinel, Defender, Guardian, Knight), que
só tinham conteúdo narrativo, "Sun Lord" já tinha mecânica numérica real implementada desde o Livro 16
(fase Grand Master) — Kai-blast (`KAI_BLAST_COST = 4`, dano de 2 números do Random Number Table) e o
bônus de fogo do Grand Weaponmastery (`GRAND_WEAPONMASTERY_FIRE_BONUS = 1`). O texto do `imprvdsc.htm`
deste livro é **verbatim idêntico** ao do Livro 16. Isso confirma, com conteúdo real pela primeira vez
na fase New Order, que a correção baseline-aware do Livro 23 funciona corretamente também no **caminho
positivo** (antes só validado no caminho negativo, com um personagem de 7 Disciplinas que NÃO deveria
ganhar Kai-blast) — um personagem New Order com 11 Disciplinas brutas e Kai-surge agora corretamente
ganha acesso ao Kai-blast e ao bônus de fogo, verificado tanto por teste unitário quanto por Playwright
manual (rank exibido como "Sun Lord" após escolher a Disciplina extra, corretamente).

### Sem mudança de código

Nenhuma Disciplina nova, mesma lista de equipamento e tabela de Arma Kai do Livro 26 (sem reordenar
nem trocar item desta vez). Sem mudança de `SAVE_VERSION`.
