# Changelog

Este projeto usa [Semantic Versioning](https://semver.org/). `app/` e `api/` são versionados juntos
(sempre lançados/publicados como um par) — a versão exibida no rodapé do app e em `GET /healthz` da
API deve ser sempre a mesma.

## [0.33.0] — 2026-09-15

**Nova fase: "World of Lone Wolf"** — Livro 1, *Grey Star the Wizard*, adicionado. Diferente de toda
entrega anterior desta sessão, **não é uma continuação numérica** da série principal: é um spin-off
independente (protagonista Grey Star, um mago Shianti; concepção de Joe Dever e Gary Chalk, texto de Ian
Page, 1985), com numeração própria reiniciada no Livro 1 e um sistema de personagem/combate genuinamente
diferente. Ver ADR-0008 para o detalhamento completo.

- **3 atributos em vez de 2**: COMBAT SKILL, ENDURANCE e a novidade **WILLPOWER** (sem teto — pode subir
  acima do inicial e cair abaixo de zero), gasto para amplificar dano em combate.
- **Combate com multiplicador de WILLPOWER**: ao empunhar o Wizard's Staff com WILLPOWER > 0, o jogador
  escolhe quantos pontos gastar por rodada; o dano ao inimigo é multiplicado por esse número. Penalidade
  de arma sem o Staff em uso: -6 com outra arma (ou o Staff sem WILLPOWER), -8 desarmado.
- **"Magical Powers"**: 7 poderes fixos, escolhe 5 no início, sem progressão nenhuma neste livro —
  diferente de toda Disciplina Kai/Magnakai/Grand Master/New Order, que cresce com o rank. Escolher
  Alchemy concede um Herb Pouch (3º container de inventário).
- **Equipamento fixo** (não "escolha N de uma lista"): kit inicial fixo + um presente único
  escolha-1-de-3 dos Mestres Shianti. Moeda ("Nobles") começa em 0, só ganha matando inimigos.
- **Arquitetura paralela isolada**: `GreyStarActionChart`, motor e telas próprios, sem tocar
  `ActionChart` nem nenhum componente das 4 fases já existentes — decisão explícita do usuário, ver
  ADR-0008. Sempre desbloqueado na seleção de livros, como o Livro 21 (sem carry-over).
- 350 seções, 27 becos sem saída, 2 seções-quebra-cabeça, aponta pro Livro 2 da série Grey Star ("The
  Forbidden City", fora do escopo desta entrega).

`SAVE_VERSION`: 8 → 9 (forma do save alargada para aceitar `GreyStarActionChart` — sem migração de
saves antigos, mesmo padrão de todo bump anterior).

**Efeito colateral nos 29 livros já implementados**: o parser passou a preservar `<blockquote>`/`<ul>`/
`<li>`/`<dl>`/`<dt>`/`<dd>` (necessários pras seções de Grey Star) em vez de descartá-los — regenerar
`sections.*.json` pra todos os livros restaura a formatação real de listas de itens e versos/charadas
que antes eram achatados em texto corrido. Mudança puramente estrutural (superset mais permissivo),
sem nenhuma mudança de conteúdo — validado pelos 538 testes já existentes, que continuaram passando
inalterados.

## [0.32.0] — 2026-09-15

Livro 29, *The Storms of Chai*, adicionado — **nona entrega da fase New Order**, com carry-over normal
a partir do Livro 28. Ver ADR-0007 (seção "Atualização — Livro 29") para o detalhamento completo.

- **Produção real de uma era radicalmente diferente**: salto narrativo de 17 anos (Livro 28 era MS
  5085, este é MS 5102), monastério novo, copyright de 2016 (só "Joe Dever", sem "Brian Williams").
  Apesar disso, `gamerulz.htm`/`discplnz.htm` confirmam que as regras são **mecanicamente idênticas**
  a todo livro anterior — carry-over normal, mesmas 16 Disciplinas, mesma regra de 5 pra início do
  zero. Reforça o critério já estabelecido: `gamerulz.htm` decide, não a moldura narrativa.
- Rank "Grand Thane" (13 Disciplinas) ganha conteúdo real (narrativo) em `imprvdsc.htm`, validando de
  forma cruzada a fórmula de rank com base 5 introduzida no Livro 21.
- **Recorrência da peculiaridade de morte não marcada** (vista antes no Livro 24): a seção 253 narra a
  morte do personagem sem a classe `deadend` — já coberto pela lógica existente do motor, sem mudança
  de código, só documentado em teste (que também precisou ser generalizado, já que este é o primeiro
  livro sem NENHUM beco sem saída marcado).
- Mesma lista de equipamento e tabela de Arma Kai do Livro 28. 350 seções, 3 seções-quebra-cabeça.
- **O Livro 30 "Dead in the Deep" nunca será publicável pelo Project Aon** (sem licença, sem planos de
  obtê-la) — o Livro 29 é, portanto, provavelmente a última entrega implementável da fase New Order.

Sem mudança de `SAVE_VERSION`.

## [0.31.0] — 2026-09-15

Livro 28, *The Hunger of Sejanoz*, adicionado — **oitava entrega da fase New Order**, com carry-over
normal a partir do Livro 27. Ver ADR-0007 (seção "Atualização — Livro 28") para o detalhamento
completo.

- **Primeira vez na fase New Order com uma contagem de seções diferente de 350**: este livro tem
  **300 seções**.
- **Nenhuma Disciplina nova**: mesmo pool de 16 dos Livros 21-27. Mesma lista de equipamento e tabela
  de Arma Kai do Livro 27.
- Rank "Sun Thane" (12 Disciplinas) ganha conteúdo real (só narrativo, sem mecânica numérica desta
  vez) em `imprvdsc.htm`, validando de forma cruzada a fórmula de rank com base 5 introduzida no
  Livro 21.
- Carry-over do Livro 27 confirmado normal (mantém CS/EP, Itens Especiais, Arma Kai, Nome Kai, Armas
  normais e Itens de Mochila; ganha +1 Disciplina Grand Master e +1 CS/+2 EP).
- 4 becos sem saída, zero seções-quebra-cabeça, final canônico único e limpo em `sect300`, apontando
  para o Livro 29 "The Storms of Chai".

Sem mudança de `SAVE_VERSION`.

## [0.30.0] — 2026-09-15

Livro 27, *Vampirium*, adicionado — **sétima entrega da fase New Order**, com carry-over normal a
partir do Livro 26. Ver ADR-0007 (seção "Atualização — Livro 27") para o detalhamento completo.

- **Nenhuma Disciplina nova**: mesmo pool de 16 dos Livros 21-26. Lista de equipamento e tabela de Arma
  Kai idênticas às do Livro 26.
- **Primeiro livro da fase New Order onde um personagem totalmente sequencial alcança o rank "Sun
  Lord"** (11 Disciplinas) — o mesmo rank que já tem mecânica numérica real implementada no motor
  desde o Livro 16 (Kai-blast, bônus de fogo do Grand Weaponmastery). O texto de `imprvdsc.htm` deste
  livro é idêntico ao do Livro 16, confirmando com conteúdo real, pela primeira vez na fase New Order,
  que a correção do bug de limiares de `combat.ts` (feita no Livro 23) funciona corretamente também no
  caminho positivo — um personagem com 11 Disciplinas e Kai-surge agora ganha acesso ao Kai-blast
  corretamente.
- Carry-over do Livro 26 confirmado normal (mantém CS/EP, Itens Especiais, Arma Kai, Nome Kai, Armas
  normais e Itens de Mochila; ganha +1 Disciplina Grand Master e +1 CS/+2 EP).
- 350 seções, 13 becos sem saída, 2 seções-quebra-cabeça com fallback de escolha, final canônico único
  em `sect350`, apontando para o Livro 28 "The Hunger of Sejanoz".

Sem mudança de `SAVE_VERSION`.

## [0.29.0] — 2026-09-15

Livro 26, *The Fall of Blood Mountain*, adicionado — **sexta entrega da fase New Order**, com
carry-over normal a partir do Livro 25. Ver ADR-0007 (seção "Atualização — Livro 26") para o
detalhamento completo.

- **Carry-over normal confirmado apesar de um salto temporal na narrativa**: diferente dos Livros
  22-25 (que retomavam a cena exata do final anterior), o `tssf.htm` deste livro tem "um ano se passou"
  antes de introduzir a nova missão, referenciando os Livros 24/25 via notas de rodapé. `gamerulz.htm`
  confirma que o mecanismo de carry-over continua o mesmo de sempre — critério refinado: o teste
  decisivo é o `gamerulz.htm`, não a estrutura narrativa do `tssf.htm`.
- **Nenhuma Disciplina nova**: mesmo pool de 16 dos Livros 21-25.
- Rank "Sun Knight" (10 Disciplinas) ganha conteúdo real (narrativo) em `imprvdsc.htm`, validando de
  forma cruzada a fórmula de rank com base 5 introduzida no Livro 21.
- Lista de equipamento reordenada na página, sem troca de item (mesmos 10 itens do Livro 25).
- Primeiro livro da fase New Order **sem nenhuma seção-quebra-cabeça**.
- Carry-over do Livro 25 confirmado normal (mantém CS/EP, Itens Especiais, Arma Kai, Nome Kai, Armas
  normais e Itens de Mochila; ganha +1 Disciplina Grand Master e +1 CS/+2 EP).
- 350 seções, 5 becos sem saída, final canônico único e limpo em `sect350`, apontando para o Livro 27
  "Vampirium".

Sem mudança de `SAVE_VERSION`.

## [0.28.0] — 2026-09-15

Livro 25, *Trail of the Wolf*, adicionado — **quinta entrega da fase New Order**, com carry-over normal
a partir do Livro 24. Ver ADR-0007 (seção "Atualização — Livro 25") para o detalhamento completo.

- **Confirmado, via `tssf.htm`, que é uma continuação direta da história** — a abertura retoma
  literalmente a cena final do Livro 24 (a notícia do desaparecimento de Lone Wolf). Segue a regra
  normal de desbloqueio.
- **Nenhuma Disciplina nova**: mesmo pool de 16 dos Livros 21-24.
- **Lista de equipamento reverte a troca do Livro 24**: Flute volta a substituir a Lute (Broadsword,
  introduzido no Livro 24, permanece — Quarterstaff não retorna).
- Rank "Kai Grand Guardian" (9 Disciplinas) ganha conteúdo real (narrativo) em `imprvdsc.htm`,
  validando de forma cruzada a fórmula de rank com base 5 introduzida no Livro 21.
- **Reconfirma, sem novidade, a pendência já registrada do Kai-surge "atacar até 3 inimigos
  simultaneamente"** (issue #61/JOGOS-92, ADR-0006) — o mesmo texto ambíguo do Livro 14 (fase Grand
  Master) reaparece aqui no rank equivalente da fase New Order; continua deliberadamente não
  implementado.
- Carry-over do Livro 24 confirmado normal (mantém CS/EP, Itens Especiais, Arma Kai, Nome Kai, Armas
  normais e Itens de Mochila; ganha +1 Disciplina Grand Master e +1 CS/+2 EP).
- 350 seções, 7 becos sem saída, 7 seções-quebra-cabeça com fallback de escolha, final canônico único
  em `sect350` (sem a peculiaridade de "vitória pírrica" vista no Livro 24), apontando para o Livro 26
  "The Fall of Blood Mountain".

Sem mudança de `SAVE_VERSION`.

## [0.27.0] — 2026-09-15

Livro 24, *Rune War*, adicionado — **quarta entrega da fase New Order**, com carry-over normal a partir
do Livro 23. Ver ADR-0007 (seção "Atualização — Livro 24") para o detalhamento completo.

- **Confirmado, via `tssf.htm`, que é uma continuação direta da história** (não uma aventura nova
  independente como o Livro 21) — a abertura retoma literalmente a cena final do Livro 23 (retorno a
  Holmgard). Segue a regra normal de desbloqueio: só libera após completar o Livro 23.
- **Nenhuma Disciplina nova**: mesmo pool de 16 dos Livros 21-23.
- **Primeira lista de equipamento genuinamente diferente desde o Livro 21**: Quarterstaff foi trocado
  por Broadsword e Flute por Lute (mesmas categorias, mesma ausência de efeito mecânico) — as demais
  regras (escolha 5, até 2 armas, ouro +20, mochila até 10, tabela de Arma Kai) permanecem idênticas.
- Rank "Kai Grand Defender" (8 Disciplinas) ganha conteúdo real (narrativo) em `imprvdsc.htm`,
  validando de forma cruzada a fórmula de rank com base 5 introduzida no Livro 21.
- Carry-over do Livro 23 confirmado normal (mantém CS/EP, Itens Especiais, Arma Kai, Nome Kai, Armas
  normais e Itens de Mochila; ganha +1 Disciplina Grand Master e +1 CS/+2 EP).
- 350 seções, 2 becos sem saída marcados no original, mais 4 seções de "vitória pírrica" (a missão é
  cumprida mas o personagem morre) que o livro-fonte não marca com a classe de beco sem saída — uma
  peculiaridade de conteúdo já coberta pela lógica existente do motor (qualquer final que não seja a
  seção canônica do livro já é tratado como derrota), sem exigir mudança de código. 3 seções-quebra-
  cabeça com fallback de escolha. Final canônico único em `sect350`, apontando para o Livro 25 "Trail
  of the Wolf".

Sem mudança de `SAVE_VERSION`.

## [0.26.0] — 2026-09-15

Livro 23, *Mydnight's Hero*, adicionado — **terceira entrega da fase New Order**, com carry-over normal
a partir do Livro 22. Ver ADR-0007 (seção "Atualização — Livro 23") para o detalhamento completo.

- **Nenhuma Disciplina nova**: mesmo pool de 16 Disciplinas dos Livros 21/22.
- **`imprvdsc.htm` ganha um novo patamar de rank com conteúdo real**: "Kai Grand Sentinel" (melhorias
  narrativas, sem bônus numérico). Um personagem que completou os Livros 21 e 22 sequencialmente chega
  ao Livro 23 com 7 Disciplinas Grand Master e mostra exatamente esse rank — confirmação cruzada da
  fórmula de rank com base 5 introduzida no Livro 21.
- **Correção de um bug real de combate**: os limiares numéricos de `combat.ts` para os ranks Sun Lord,
  Grand Crown e Sun Prince (usados por Kai-blast, Kai-ray e os bônus de Grand Weaponmastery) comparavam
  a contagem bruta de Disciplinas Grand Master contra valores fixos (7/10/11), calibrados apenas para a
  fase Grand Master (base 1). Um personagem do New Order que completasse os Livros 21 e 22 em sequência
  chegava ao Livro 23 com exatamente 7 Disciplinas — o mesmo valor bruto do limiar de Sun Lord — e, se
  tivesse escolhido Kai-surge, ganharia incorretamente acesso ao Kai-blast (uma habilidade de dano de
  Grand Master avançado), apesar de estar apenas no rank "Kai Grand Sentinel" na escada do New Order
  (bem mais baixo). Corrigido: os limiares agora são posições no array de ranks (`GRAND_MASTER_RANKS`)
  comparadas contra a contagem de Disciplinas ajustada pela base da fase (`getGrandMasterBaseline`,
  nova função exportada de `kaiRank.ts`) — resolve a dívida técnica já registrada na ADR-0007 desde o
  Livro 21, sem alterar nenhum comportamento da fase Grand Master (base 1 preservada).
- Carry-over do Livro 22 confirmado normal (mantém CS/EP, Itens Especiais, Arma Kai, Nome Kai, Armas
  normais e Itens de Mochila; ganha +1 Disciplina Grand Master e +1 CS/+2 EP).
- 350 seções, 7 becos sem saída, 3 seções-quebra-cabeça com alternativa de escolha, final único que
  aponta para o Livro 24 "Rune War" (série contínua confirmada).

Sem mudança de `SAVE_VERSION`.

## [0.25.0] — 2026-09-15

Livro 22, *The Buccaneers of Shadaki*, adicionado — **segunda entrega da fase New Order**, com carry-over
normal a partir do Livro 21. Ver ADR-0007 (seção "Atualização — Livro 22") para o detalhamento completo.

- **Nenhuma Disciplina nova**: mesmo pool de 16 Disciplinas do Livro 21 (12 Grand Master + Astrology/
  Herbmastery/Elementalism/Bardsmanship) — confirmado, sem mudança em `types.ts`.
- **`imprvdsc.htm` tem conteúdo real pela primeira vez** — o rank "Kai Grand Master Superior" (6
  Disciplinas: 5 do início + 1 do carry-over do Livro 21) recebe texto próprio no livro, todo
  narrativo (sem bônus de Combat Skill/Endurance). Validação cruzada independente de que a fórmula de
  rank com base 5 (`NEW_ORDER_RANK_BASELINE`, introduzida no Livro 21) está correta.
- **Correção de bug**: `needsKaiWeapon` na tela de criação de personagem perguntava novamente pela Arma
  Kai mesmo quando o personagem já tinha uma (vindo de carry-over do Livro 21) — o Livro 22 também
  define uma tabela de Armas Kai (pra suportar início do zero direto nele), o que expôs a falha.
  Corrigido para `equipmentConfig.kaiWeaponTable !== undefined && !isCarryOver`, no mesmo padrão já
  usado por `needsKaiName`.
- Carry-over do Livro 21 confirmado normal (mantém CS/EP, Itens Especiais, Arma Kai, Nome Kai,
  Armas normais e Itens de Mochila; ganha +1 Disciplina Grand Master e +1 CS/+2 EP) — sem mudança de
  código, mecanismo já existente reaproveitado.
- 350 seções, 9 becos sem saída, 2 seções-quebra-cabeça com alternativa de escolha, final único que
  aponta para o Livro 23 "Mydnight's Hero" (série contínua confirmada).

Sem mudança de `SAVE_VERSION`.

## [0.24.0] — 2026-09-15

Novos botões "Baixar Backup" e "Importar Backup" — um backup do save independente tanto do
`localStorage` (preso a um navegador/dispositivo, apagado se o usuário limpar dados) quanto do save
na nuvem (preso ao Postgres do servidor, que pode ser perdido por questões de infraestrutura no
cluster k3s caseiro, independente de deploys normais da aplicação — investigado: o PVC do Postgres já
está configurado corretamente com `strategy: Recreate`, então o motivo de uma eventual perda não está
no código da aplicação).

- "Baixar Backup" gera um arquivo `.json` com o save atual (mesmo formato usado no `localStorage`/
  nuvem), pra guardar onde o usuário quiser.
- "Importar Backup" lê esse arquivo, carrega o estado no app (mesmo caminho de "Carregar da Nuvem") e
  **salva de volta no servidor automaticamente**, restaurando um save perdido na nuvem.
- Validação clara pra arquivo inválido ou de uma versão de save incompatível.

Sem mudança de `SAVE_VERSION` — usa o mesmo formato já existente.

## [0.23.0] — 2026-09-15

Livro 21, *Voyage of the Moonstone*, adicionado — **primeiro livro da nova fase "New Order"**, que
sucede a fase Grand Master (Livros 13-20, completa). Ver ADR-0007 para o detalhamento completo.

- **Sem sistema de Disciplinas paralelo, diferente de toda transição de fase anterior**: o New Order
  reaproveita literalmente o mesmo pool de 12 Disciplinas Grand Master (mesmos números, mesmo
  `combat.ts`) e adiciona só 4 novas, puramente narrativas: Astrology, Herbmastery, Elementalism,
  Bardsmanship. `applyGrandMasterDisciplines` agora aceita uma contagem inicial configurável (4 pro
  Grand Master, 5 pro New Order).
- **Rank recalculado com base deslocada**: a mesma escada de 12 nomes já usada no Grand Master, só que
  reindexada — um personagem novo do Livro 21 começa com 5 Disciplinas e mostra rank "Kai Grand Master
  Senior" (confirmado verbatim em `levels.htm`), não "Kai Grand Guardian" como a fórmula antiga
  produziria. `getGrandMasterRank` agora aceita uma base configurável.
- **Personagem começa 100% do zero** — sem carry-over do Livro 20 (confirmado: `gamerulz.htm` rola
  CS/EP do zero, sem nenhuma referência à Ficha de Aventura do livro anterior). A tela de introdução
  não oferece mais a opção "Transferir personagem" pro Livro 21 — novo campo `BookMeta.allowsCarryOver`
  (default `true`) evita que a lógica genérica de "livro anterior por ordem" ofereça uma transferência
  que o próprio livro não prevê.
- **Nome Kai (novidade real, nunca vista antes na série)**: o personagem pode se nomear livremente ou
  sortear um nome das duas tabelas de 10 entradas de `kainame.htm`. Exige campo novo persistente
  (`kaiName`), por isso **`SAVE_VERSION` sobe de 7 para 8**.
- **Arma Kai**: escolhida (ou sorteada) entre 10 armas nomeadas, dando +5 Combat Skill enquanto
  equipada — confirmado que esse bônus **soma** com o do Grand Weaponmastery quando o tipo de arma
  bate, em vez de substituir (novo campo `kaiWeaponType`, não afeta `SAVE_VERSION` porque já estava
  incluído no bump acima). O bônus situacional maior (+6 a +9 CS contra um tipo de inimigo/condição
  específica) fica documentado, não implementado — mesma categoria de pendência do bônus de
  Weaponmastery+Bow.
- Equipamento: escolha 5 de 10 itens (Flute é novo). Mapa automático: Map of the Coastal Route.
- Pendência do Kai-surge "atacar 3 inimigos simultaneamente" (issue #61/JOGOS-92) segue sem novidade.

## [0.22.0] — 2026-09-15

Tela de seleção de livros agora agrupa os títulos por fase — Kai, Magnakai, Grand Master, New Order, e
um placeholder "World of Lone Wolf (ainda não implementado)" pra fase seguinte, que ainda não tem
nenhum livro. A lógica de desbloqueio (o próximo livro libera assim que o anterior é completado) não
mudou — já funcionava corretamente em toda transição de fase, só a apresentação visual mudou.

Sem mudança de `SAVE_VERSION`.

## [0.21.0] — 2026-09-15

Livro 20, *The Curse of Naar*, adicionado — oitava e **última entrega da fase Grand Master**. A fase
Grand Master (Livros 13-20) está completa. A seção final encerra a fase com *"the first of the New
Order adventures is about to begin"*, apontando pro Livro 21 "Voyage of the Moonstone" — início de
uma fase nova, fora do escopo deste trabalho.

- Equipamento: escolha 4 de 10 itens — pela primeira vez Quarterstaff **e** Broadsword aparecem juntos
  na mesma lista (Livros 17-19 só alternavam entre os dois). Mapa automático: Map of the Planes of
  Existence.
- **Novo rank Sun Prince (11 Disciplinas)**, alcançável neste livro por quem carrega um personagem com
  os 7 livros anteriores completados. Kai-surge ganha **"Kai-ray"**: dano fixo de 15 Endurance, 1 uso
  por combate inteiro (não por rodada, diferente do Kai-blast), custa 4 Endurance, exige Endurance >
  10, mutuamente exclusivo com qualquer outro ataque psíquico na rodada. **Decisão de design**:
  Kai-ray coexiste com Kai-blast como uma terceira opção independente (não substitui) — o jogador
  ganha ambos ao chegar em Sun Prince. Implementado em `combat.ts`.
- **Caso novo no conteúdo**: as seções 297 e 338 têm `class="puzzle"` e `class="deadend"` na mesma
  seção (sem link de escolha separado) — confirmado que o parser já lida com isso corretamente, sem
  mudança de código.
- Pendência do Kai-surge "atacar 3 inimigos simultaneamente" (issue #61/JOGOS-92) segue sem nenhuma
  informação nova — permanece em aberto ao final de toda a fase Grand Master.

Sem mudança de `SAVE_VERSION`.

## [0.20.0] — 2026-09-15

Livro 19, *Wolf's Bane*, adicionado — sétima entrega da fase Grand Master. Este livro é o penúltimo
antes do final da série: a seção 350 encerra apontando pro Livro 20, "The Curse of Naar".

- Equipamento: escolha 4 de 9 itens — Broadsword volta a aparecer (a mesma alternação já vista nos
  Livros 17/18). Mapa automático: Map of Sommerlund and the Wildlands.
- 6 seções-quebra-cabeça (18, 177, 210, 251, 252, 320) — o Livro 18 tinha sido o único sem nenhuma.
- **Novo rank Grand Crown (10 Disciplinas)**, alcançável neste livro por quem carrega um personagem
  com os 6 livros anteriores completados. Traz o **primeiro bônus numérico real desde o Sun Lord
  (Livro 16)**:
  - **Grand Weaponmastery**: +3 Combat Skill lutando desarmado — substitui completamente a
    penalidade normal de -4, em vez de apenas reduzi-la (diferente de Tutelary/Scion-kai).
    Implementado em `combat.ts`.
  - **Kai-alchemy ganha o feitiço Teleport** (custa 1-5 Endurance por uso) — número real, mas sem
    nenhum gancho no motor atual (o app não modela viagem/teleporte fora da navegação linear por
    seções); documentado, não implementado, mesma categoria de todo o resto de Magi-magic/Kai-alchemy.
- Pendência do Kai-surge "atacar 3 inimigos simultaneamente" (issue #61/JOGOS-92) segue sem nenhuma
  informação nova.

Sem mudança de `SAVE_VERSION`.

## [0.19.0] — 2026-09-14

Livro 18, *Dawn of the Dragons*, adicionado — sexta entrega da fase Grand Master. Nenhuma mudança em
`combat.ts`/`disciplines.ts` foi necessária.

- Equipamento: escolha 4 de 9 itens — Quarterstaff volta a aparecer (o Broadsword do Livro 17 foi uma
  troca de um livro só, não uma substituição permanente). Mapa automático: Map of Northern Magnamund.
- **Primeiro livro Grand Master sem nenhuma seção-quebra-cabeça** — confirmado via enumeração completa
  de todas as classes CSS usadas nas 350 seções.
- Ranks Sun Lord (7 Disciplinas) e Sun Thane (8 Disciplinas) repetidos sem nenhuma mudança numérica.
- **Novo rank Grand Thane (9 Disciplinas)** aparece pela primeira vez em `imprvdsc.htm`, mas — lido na
  íntegra — todas as 6 entradas (Deliverance, Assimilance, Kai-surge, Grand Nexus, Telegnosis,
  Magi-magic) são puramente narrativas, confirmando que o salto numérico do Sun Lord no Livro 16
  segue sendo pontual.
- Pendência do Kai-surge "atacar 3 inimigos simultaneamente" (issue #61/JOGOS-92) segue sem nenhuma
  informação nova.

Sem mudança de `SAVE_VERSION`.

## [0.18.0] — 2026-09-14

Livro 17, *The Deathlord of Ixia*, adicionado — quinta entrega da fase Grand Master. O livro mais
simples de implementar desde o início da fase: `cmbtrulz.htm`/`discplnz.htm` são byte-idênticos ao
Livro 16, então **nenhuma mudança em `combat.ts`/`disciplines.ts`** foi necessária.

- Equipamento: escolha 4 de 9 itens — Broadsword é uma opção nova (nunca oferecida como arma inicial
  em nenhum livro anterior), no lugar do Quarterstaff do Livro 16. Mapa automático: Map of Ixia and
  the Hardlands.
- **Rank Sun Lord (7 Disciplinas) repetido sem nenhuma mudança numérica**: os dois bônus do Livro 16
  (fogo do Grand Weaponmastery +1 Endurance, Kai-blast) continuam exatamente iguais.
- **Novo rank Sun Thane (8 Disciplinas)** aparece pela primeira vez em `imprvdsc.htm` — lido na
  íntegra, as 6 entradas (Animal Mastery, Deliverance, Grand Huntmastery, Grand Pathsmanship,
  Kai-screen, Kai-alchemy) são todas puramente narrativas, sem nenhum número de Combat
  Skill/Endurance — mesmo padrão dos ranks Kai Grand Guardian e Sun Knight.
- Pendência do Kai-surge "atacar 3 inimigos simultaneamente" (issue #61/JOGOS-92) segue sem nenhuma
  informação nova.

Sem mudança de `SAVE_VERSION`.

## [0.17.0] — 2026-09-14

Livro 16, *The Legacy of Vashna*, adicionado — quarta entrega da fase Grand Master. Equipamento muda
de forma pela primeira vez desde o início da fase: escolha 4 itens (não 5) de uma lista de 9 —
2 Meals (não 4) e Quarterstaff no lugar do Spear. Mapa automático: Map of the Maakengorge.

- **Primeira mudança mecânica real na fase Grand Master desde o Livro 13**: o rank **Sun Lord**
  (7 Disciplinas Grand Master) tem conteúdo genuinamente numérico em `imprvdsc.htm`, ao contrário de
  todo o conteúdo puramente narrativo dos ranks Kai Grand Guardian (5) e Sun Knight (6):
  - **Grand Weaponmastery**: arma Grand-mastered equipada (exceto Quarterstaff, "wholly wooden")
    inflige +1 Endurance extra de dano por rodada bem-sucedida, a partir do rank Sun Lord.
  - **Kai-surge ganha "Kai-blast"**: ataque psíquico de 2 a 18 pontos de Endurance de dano direto
    (soma de 2 números da Random Number Table, '0'=1), custando 4 Endurance ao usuário, "não pode ser
    combinado com nenhuma outra forma de ataque psíquico". O texto fonte não esclarece se o inimigo
    ainda contra-ataca na mesma rodada — **decisão de design tomada com o usuário**: Kai-blast
    substitui a rodada inteira (sem Combat Ratio, sem contra-ataque do inimigo naquela rodada).
- **Pendência do Kai-surge "atacar 3 inimigos simultaneamente" (Kai Grand Guardian, issue
  #61/JOGOS-92) segue sem solução** — não mencionada em nenhum lugar do conteúdo do Livro 16.
- Todas as outras entradas do rank Sun Lord (Assimilance, Grand Huntmastery, Telegnosis, Magi-magic)
  são puramente narrativas.

Sem mudança de `SAVE_VERSION` — Kai-blast é derivado de `grandMasterDisciplines`/contagem, sem novo
campo persistente no `ActionChart`.

## [0.16.0] — 2026-09-14

Livro 15, *The Darke Crusade*, adicionado — terceiro livro da fase Grand Master. Regras de
disciplina, crescimento, combate e equipamento seguem idênticas aos Livros 13-14; só o mapa
automático muda (Map of the Western Tentarias).

- **Improved Grand Master Disciplines ganha conteúdo real pro rank Sun Knight (6 Disciplinas)**:
  lido na íntegra, as 6 entradas (Grand Weaponmastery, Deliverance, Grand Pathsmanship, Grand Nexus,
  Telegnosis, Kai-alchemy) são todas puramente narrativas — nenhuma tem um número de Combat
  Skill/Endurance, nem mesmo o feitiço "Strength" de Kai-alchemy, que menciona um "temporary
  increase in COMBAT SKILL and ENDURANCE" sem especificar quanto.
- **Kai-surge não aparece no rank Sun Knight** — a regra de "atacar até 3 inimigos simultaneamente"
  do rank anterior (Kai Grand Guardian, Livro 14) não é repetida, estendida nem esclarecida aqui.
  Continua exatamente como pendência real, sem informação nova (issue #61/JOGOS-92 seguem abertas).
- Nenhuma mudança em `combat.ts`/`disciplines.ts` — mesmas Disciplinas, mesmos números, mesma escada
  de rank dos livros anteriores.

Sem mudança de `SAVE_VERSION`.

## [0.15.0] — 2026-09-14

Livro 14, *The Captives of Kaag*, adicionado — segundo livro da fase Grand Master. O livro mais
simples de implementar até agora em código novo: regras de disciplina, equipamento, combate e
crescimento seguem idênticas ao Livro 13.

- **Nota de nomenclatura**: a pasta de conteúdo deste livro se chama, por coincidência,
  `grand_master/tck/` — o mesmo nome já usado internamente pro Livro 3 (`tck`, fase Kai, um livro
  totalmente diferente). Para evitar a colisão, este livro usa o id `tcok` no registro do app, com um
  novo campo opcional `contentDirName` em `BookMeta` apontando o parser pra pasta real (`tck`) sem
  precisar mexer no conteúdo fonte.
- **Improved Grand Master Disciplines ganha conteúdo real pro rank Kai Grand Guardian (5
  Disciplinas)**: lido na íntegra, 5 das 6 entradas são puramente narrativas. A entrada de Kai-surge
  tem uma regra real — atacar até 3 inimigos simultaneamente em combate psíquico — mas é uma mudança
  estrutural de fluxo de combate (não um número de Combat Skill/Endurance), e o motor atual resolve
  combate contra um inimigo por vez. Como o texto não especifica os detalhes de resolução
  simultânea, essa regra fica registrada como pendência real (mesma categoria do bônus de
  Weaponmastery+Bow, pendente desde o Livro 6), não implementada agora.
- **Confirmado**: a lista fechada de Itens Especiais transferíveis (10 nomes) é uma regra de
  transição única — só vale na fronteira Magnakai→Grand Master, não se repete entre livros Grand
  Master seguintes. Já funcionava certo sem nenhuma mudança de código.
- Zero mudanças em `combat.ts`/`disciplines.ts` — mesmas Disciplinas, mesmos números, mesma escada
  de rank do Livro 13.

Sem mudança de `SAVE_VERSION` — nenhum campo novo em `ActionChart`.

## [0.14.0] — 2026-09-14

Livro 13, *The Plague Lords of Ruel*, adicionado — primeiro livro da nova fase **Grand Master**,
distinta da fase Magnakai (Livros 6-12, agora completa) e da fase Kai (Livros 1-5). Ver a
[ADR-0006](docs/adr/0006-fase-grand-master-e-disciplinas-em-camadas.md) para os detalhes completos da
arquitetura.

- **Terceiro sistema de Disciplinas**: 12 Disciplinas Grand Master (10 upgrades nomeados das
  Disciplinas Magnakai + 2 totalmente novas — Magi-magic e Kai-alchemy, magia de batalha ainda sem
  efeito numérico definido). Personagem escolhe 4 livremente pra começar, sem tabela de conversão.
- **Diferente de toda transição de fase anterior: `magnakaiDisciplines` NÃO é zerado.** Confirmado
  via errata oficial: os upgrades Grand Master **substituem** os bônus Magnakai correspondentes
  (não somam), mas a Disciplina Magnakai antiga continua valendo como alternativa sempre que o
  jogador não escolheu o upgrade equivalente. Implementado como uma checagem "melhor camada
  disponível" em `combat.ts` (Weaponmastery/Grand Weaponmastery, Psi-surge/Kai-surge) e
  `disciplines.ts` (Curing/Deliverance), não uma checagem de fase.
- **Kai-surge**: +8 Combat Skill / -1 Endurance por rodada (mais forte que qualquer tier Magnakai),
  modo grátis Mindblast vira +4 CS — mas o piso mínimo de Endurance pra ativar é 6, curiosamente
  maior que o piso do Archmaster Magnakai (4), uma peculiaridade real do texto original.
- **Grand Weaponmastery**: +5 CS com uma arma dominada, checklist próprio de 2 armas iniciais
  (`grandMasteredWeapons`, campo separado do `masteredWeapons` Magnakai).
- **Deliverance** ("Advanced Curing"): cura de combate de 20 Endurance quando Endurance ≤ 8 (limite
  de dias auto-adjudicado, como o Archmaster Curing do Livro 12).
- **Novo teto de rank**: escada de 12 ranks inteiramente nova (`GRAND_MASTER_RANKS`, Kai Grand Master
  Senior → Kai Supreme Master), sem relação com a escada Magnakai — um personagem começa o Livro 13
  já no rank 4 ("Kai Grand Defender").
- **Novo bônus permanente**: cada Disciplina Grand Master além das 4 iniciais concede +1 Combat
  Skill / +2 Endurance permanentes na ficha — diferente de todo bônus condicional de combate já
  existente.
- **Itens Especiais**: pela primeira vez, só uma lista fechada de 10 nomes específicos sobrevive à
  transição de fase (antes, tudo era transferido).
- Mochila sobe de 8 pra 10 slots; bônus de ouro sobe de +10 pra +20.

`SAVE_VERSION` 6 → 7 (`ActionChart` ganha `grandMasterDisciplines` e `grandMasteredWeapons`) — saves
anteriores a esta versão deixam de carregar.

## [0.13.0] — 2026-09-13

Livro 12, *The Masters of Darkness*, adicionado — sétimo e último livro da fase Magnakai. O final é
uma vitória narrativa completa (Lone Wolf derrota Darklord Gnaag, retorna herói a Sommerlund), mas
segue o mesmo padrão de encadeamento dos livros anteriores, com forward-link explícito pro Livro 13
("The Plague Lords of Ruel") — não é um encerramento especial que exija tratamento diferente no motor.

- **Equipamento volta a ter mapa automático**: combinação nova (mapa + escolha 6-de-11), diferente
  tanto do padrão mapa+5-de-10 dos Livros 7-10 quanto do padrão sem-mapa 6-de-9 do Livro 11.
  Quarterstaff e Axe voltam a aparecer na lista (ausentes desde o Livro 6), e a opção de Refeições
  passa a valer 4 em vez de 3.
- **Rank Archmaster (9 Disciplinas Magnakai) traz as melhorias mais substanciais até agora, em duas
  Disciplinas diferentes**:
  - **Psi-surge**: o bônus de combate sobe de +4 para +6 Combat Skill (custo cai de -2 para -1
    Endurance por rodada), o modo gratuito "Mindblast" sobe de +2 para +3 CS, e o piso mínimo de
    Endurance pra usar a Disciplina cai de 6 para 4. Implementado como uma terceira camada de
    override em `combat.ts`, mesma forma da melhoria de Weaponmastery do Livro 11.
  - **Curing**: nova habilidade de cura em combate — restaura 20 Endurance quando o total cai a 6 ou
    menos, mas só "uma vez a cada 100 dias" no texto original. Como o motor não rastreia nenhum
    calendário em nenhum livro, esse limite de dias é deixado pro jogador auto-adjudicar (documentado
    no próprio botão), mesma categoria de outras restrições narrativas sem contraparte de estado
    (ex.: a zona de caça desabilitada em Kalte). Novo botão no `CombatModal`, visível só quando a
    condição (Curing + rank Archmaster + Endurance ≤ 6) é satisfeita.
  - As outras 3 entradas do rank (Animal Control, Huntmastery, Nexus) seguem puramente narrativas.
- **Correção de bug**: o toggle de Psi-surge no combate mostrava sempre "Endurance ≤ 6" e usava o
  limiar de Endurance errado pra decidir se o botão fica habilitado, mesmo pra um personagem
  Archmaster (cujo limiar real é 4) — corrigido exportando o cálculo correto de `combat.ts` em vez de
  duplicar a constante na UI.

Zero seções-quebra-cabeça neste livro. Disciplinas Magnakai, regras de combate (fora as melhorias
acima) e escada de Rank confirmadas inalteradas. Sem mudança de `SAVE_VERSION` — nenhum campo novo em
`ActionChart`.

## [0.12.0] — 2026-09-13

Livro 11, *The Prisoners of Time*, adicionado — sexto livro da fase Magnakai ("o penúltimo episódio
da saga Magnakai", segundo o próprio texto):

- **Tela de seleção de livros**: lista de livros agora em grade de 3 colunas (2 em telas médias, 1
  em telas estreitas) em vez de uma coluna só — necessário porque a lista só cresce a cada livro
  novo.
- **Equipamento muda de forma real**: escolha passa de 5-de-10 pra **6-de-9** (usa o `equipmentMode`
  `choose-six` já existente, reaproveitado do Livro 4). Os itens "Potion of Alether" e "3 Fireseeds"
  somem da lista (confirmado via `errata.htm` que isso NÃO é uma mudança documentada — é o texto
  original, mais enxuto). **Nenhum mapa é concedido automaticamente** — único livro Magnakai até
  agora sem essa concessão, porque a história joga Lone Wolf direto num plano sobrenatural (a
  Daziarn) em vez de um território normal pra atravessar; o personagem começa só com 2 Refeições e
  Coroas de Ouro.
- **Rank Scion-kai (8 Disciplinas Magnakai) traz a melhoria mais forte até agora**: a entrada de
  Weaponmastery tem DUAS regras numéricas reais — o bônus de arma dominada sobe de +3 para +4 Combat
  Skill, e a penalidade de combate desarmado cai ainda mais, de -2 (Tutelary) para -1. Ambas
  implementadas em `combat.ts` como uma terceira camada acima da já existente lógica de Tutelary
  (Livro 8). As outras 4 entradas do rank seguem puramente narrativas.
- Zero seções-quebra-cabeça neste livro. Disciplinas Magnakai, regras de combate (fora a melhoria de
  Weaponmastery acima), escada de Rank e Lore-circles confirmados inalterados.

Sem mudança de `SAVE_VERSION` — nenhum campo novo em `ActionChart` (a mudança de Combat Skill é
puramente derivada, sem estado novo pra persistir).

## [0.11.0] — 2026-09-13

Livro 10, *The Dungeons of Torgar*, adicionado — quinto livro da fase Magnakai. Primeiro livro
Magnakai a exigir um campo novo em `ActionChart` desde o Livro 6:

- **Nova Poção de Alether**: substitui "3 Fireseeds" como 10º item de equipamento (mudança
  intencional, confirmada via `errata.htm` — harmonização com a Collector's Edition). Concede +2
  Combat Skill durante uma luta inteira, dose única, bebida antes do combate começar. Implementada
  como novo campo `combatPotionDoses` (`SAVE_VERSION` 5→6), consumida via `useCombatPotion` e um
  novo checkbox "pré-luta" no `CombatModal` — diferente do toggle por rodada do Psi-surge, este fica
  ativo pra luta inteira depois de marcado uma única vez.
- **Improved Disciplines ganha o rank Mentora (7 Disciplinas Magnakai)**: a entrada de Weaponmastery
  tem uma regra numérica real (+2 à rolagem da Random Number Table ao usar arco ou arma de
  arremesso), mas essa regra **estende uma mecânica-base que nunca foi implementada em nenhum livro
  Magnakai anterior** (a regra original de Weaponmastery+Bow do Livro 6, +3 à mesma rolagem) — segue
  fora de escopo, mesma categoria de auto-adjudicação manual já usada pra Refeições/Flechas. As
  outras 4 entradas do rank Mentora são puramente narrativas.
- Zero seções-quebra-cabeça neste livro (diferente dos Livros 8/9).
- Disciplinas Magnakai, regras de combate, escada de Rank e Lore-circles confirmados inalterados.

`SAVE_VERSION` 5 → 6 (`ActionChart` ganha `combatPotionDoses`) — saves anteriores a esta versão
deixam de carregar.

## [0.10.0] — 2026-09-13

Livro 9, *The Cauldron of Fear*, adicionado — quarto livro da fase Magnakai. O livro Magnakai mais
simples de implementar até agora: nenhuma regra mecânica nova, só mais conteúdo encaixando nos
mecanismos já genéricos:

- Equipamento (5 de 10 itens) idêntico em conteúdo aos Livros 7 e 8, só muda o mapa concedido
  automaticamente (Map of the Republic of Anari, sem risco de colisão com nenhum item nomeado na
  história deste livro).
- Três seções-quebra-cabeça (sect115, sect204, sect241), cada uma com uma escolha normal de
  fallback — mesmo padrão do Livro 8, reaproveitando o mecanismo `hasPuzzle` do Livro 5 sem código
  novo.
- "Improved Disciplines" ganha o rank Principalin (6 Disciplinas Magnakai) — lido na íntegra, as 5
  entradas (Animal Control, Invisibility, Huntmastery, Psi-surge, Nexus) são puramente narrativas,
  sem nenhum efeito numérico. Diferente do rank Tutelary do Livro 8, nenhuma mudança em `combat.ts`
  foi necessária.
- Disciplinas Magnakai, regras de combate, escada de Rank e Lore-circles confirmados inalterados.

Sem mudança de `SAVE_VERSION` — nenhum campo novo em `ActionChart`.

## [0.9.0] — 2026-09-13

Livro 8, *The Jungle of Horrors*, adicionado — terceiro livro da fase Magnakai:

- **Primeira melhoria de rank com efeito numérico real**: `imprvdsc.htm` deste livro introduz o rank
  Tutelary (5 Disciplinas Magnakai, alcançável neste livro por quem completou os Livros 6 e 7). A
  entrada de Weaponmastery no rank Tutelary reduz a penalidade de combate desarmado de -4 para -2
  Combat Skill — as outras 4 entradas do rank (Invisibility, Pathsmanship, Psi-screen, Divination)
  seguem puramente narrativas, mesmo padrão do rank Primate do Livro 7.
- Quatro seções-quebra-cabeça (sect112, sect126, sect141, sect338) reaproveitam sem nenhuma mudança
  de código o mecanismo `hasPuzzle` do Livro 5 — diferente do Livro 7, cada uma delas também tem uma
  escolha normal de fallback, então nenhuma é lida como final (0 escolhas).
- Equipamento (5 de 10 itens) idêntico em conteúdo ao do Livro 7, só muda o mapa concedido
  automaticamente (Map of the Danarg Swamp) — nomeado distinto do "Map of Tharro", um item narrativo
  separado encontrado durante a aventura.
- Disciplinas Magnakai, regras de combate, escada de Rank e Lore-circles confirmados inalterados.

Sem mudança de `SAVE_VERSION` — nenhum campo novo em `ActionChart`.

## [0.8.0] — 2026-09-13

Livro 7, *Castle Death*, adicionado — segundo livro da fase Magnakai (mesma fase do Livro 6, nenhuma
arquitetura nova):

- **Crescimento do Weaponmastery Checklist implementado**: nova função `addExtraMasteredWeapon`
  adiciona exatamente 1 arma a um Checklist já existente (distinto da escolha inicial de 3 feita no
  Livro 6, via `chooseMasteredWeapons`). A tela de criação de personagem agora distingue "escolher 3
  do zero" de "adicionar 1 arma nova", mostrando apenas as armas ainda não dominadas. Resolve a
  pendência registrada na ADR-0005 e fecha a issue #36/JOGOS-81 — a mecânica só passava a importar a
  partir deste livro, já que não havia livro Magnakai anterior pra crescer a partir.
- **Crescimento de Disciplina Magnakai (+1 por livro) confirmado em jogo**: `gamerulz.htm` deste
  livro é o primeiro a declarar a regra explicitamente; o mecanismo (`addExtraMagnakaiDiscipline`) já
  existia desde o Livro 6 e não precisou de nenhuma mudança.
- **"Improved Disciplines" (rank Primate) confirmado como narrativo, sem efeito mecânico**: as 5
  melhorias (Animal Control, Curing, Huntmastery, Psi-surge, Nexus) descrevem só flavor de história
  (repelir animal, atrasar veneno, escalar sem corda, vibrar objeto à distância, resistir a gases) —
  nenhuma altera Combat Skill, Endurance ou qualquer efeito já modelado no motor.
- Novo item na escolha de equipamento (5 de 10): **Lantern** (item de mochila comum) e **3
  Fireseeds** (Item Especial, modelado como 3 entradas separadas do mesmo nome — reaproveita o
  suporte existente a múltiplas entradas de Item Especial sem precisar de um contador novo).
- Duas seções-quebra-cabeça (sect100, sect306) reaproveitam sem nenhuma mudança de código o
  mecanismo `hasPuzzle`/`ManualSectionJump` construído no Livro 5.

Sem mudança de `SAVE_VERSION` — nenhum campo novo em `ActionChart` (primeiro livro da série a não
precisar de um).

## [0.7.0] — 2026-09-13

Livro 6, *The Kingdoms of Terror*, adicionado — primeiro livro da fase **Magnakai**, distinta da
fase Kai (Livros 1-5):

- **Novo diretório-raiz de conteúdo**: `magnakai/`, irmão de `kai/`. O pipeline de conteúdo
  (`parseContent.ts`) passa a resolver a raiz por livro (`BookMeta.contentRoot`) em vez de um
  único diretório hardcoded.
- **Sistema de Disciplinas inteiramente novo**: as 10 Disciplinas Magnakai (Weaponmastery, Animal
  Control, Curing, Invisibility, Huntmastery, Pathsmanship, Psi-surge, Psi-screen, Nexus,
  Divination) substituem as 10 Disciplinas Kai — **não existe tabela de conversão** entre elas
  (confirmado no texto original: o personagem simplesmente escolhe 3 livremente). Um personagem
  que cruza de Kai pra Magnakai tem suas Disciplinas Kai antigas zeradas (`disciplines: []`), já
  que as duas nunca coexistem de verdade.
- **Nova arma Bow** e novo Item Especial **Quiver** (6 Flechas, contador manual `arrows`, mesmo
  padrão de auto-controle já usado pra Refeições — nunca bloqueado automaticamente em combate).
- **Weaponmastery**: até 3 armas "dominadas" (+3 Combat Skill), escolhidas separadamente das armas
  carregadas — ser hábil com uma arma não significa começar com ela.
- **Psi-surge**: primeiro mecanismo de combate do motor com custo e escolha por rodada — +4 Combat
  Skill por -2 Endurance (indisponível com Endurance ≤ 6), ou o modo gratuito "Mindblast" (+2 CS,
  sem custo). Novo controle na tela de combate pra ativar por rodada.
- **Psi-screen**: bloqueia 100% da perda de Endurance por ataque de Mindforce, mesmo efeito do
  Mindshield antigo.
- **Nova escada de Rank** (Kai Master → ... → Kai Grand Master), totalmente separada da escada Kai,
  começando em "Kai Master Superior" (rank 3) com as 3 Disciplinas iniciais.
- Fora de escopo por ora (documentado, não bloqueia jogabilidade): bônus de sinergia dos
  Lore-circles, e o crescimento de +1 arma dominada por livro completado (só relevante a partir do
  Livro 7).

`SAVE_VERSION` 4 → 5 (`ActionChart` ganha `magnakaiDisciplines`, `masteredWeapons`, `arrows`) —
saves anteriores a esta versão deixam de carregar.

## [0.6.0] — 2026-09-13

Livro 5, *Shadow on the Sand*, adicionado à campanha — último livro da fase Kai:

- **400 seções, não 350**: primeira vez que um livro da série quebra a contagem fixa que o pipeline
  de conteúdo (`parseContent.ts`/`verifyContent.ts`/testes) tinha hardcoded em 4 lugares. Agora
  `BookMeta` tem um campo `sectionCount` por livro; os 4 livros anteriores ganharam
  `sectionCount: 350` explícito.
- Equipamento: escolha de 4 de 7 itens (nenhuma arma ou Item Especial novo — tudo reaproveita Dagger,
  Sword, Spear, Mace, Shield e Potion of Laumspur de dose única já existentes). Auto-concedido: Map
  of the Desert Empire.
- **Bug real de conteúdo corrigido**: duas seções (`sect58`, `sect331`) são quebra-cabeças do livro
  original ("descubra o número e vá direto pra aquela seção") que usam `<p class="puzzle">` em vez
  de `<p class="choice">`, com o link apontando pro índice do livro impresso em vez de uma seção
  diretamente. Isso fazia o parser classificá-las incorretamente como final da aventura (0 escolhas
  extraídas, mesma regra que gerava `isEnding`). Adicionado `hasPuzzle` ao parser para não
  confundi-las com um final real, e um novo controle de navegação manual (digitar o número da seção)
  pra essas duas seções — o jogador ainda precisa decifrar o número sozinho pela história, o app só
  para de travar a navegação depois disso.
- Dois achados que não exigiram nenhuma mudança de código, documentados na ADR-0004: a restrição de
  Hunting em zonas de deserto (mesmo caso do Livro 4 — a penalidade de Refeição já é sempre manual)
  e a nova mecânica de "guardar Itens Especiais em segurança no Monastério" antes da aventura (já
  auto-arbitrada pelo jogador, já que perder um item também sempre foi manual no app).

Sem mudança de schema — mesmo `SAVE_VERSION` 4.

## [0.5.0] — 2026-09-13

Livro 4, *The Chasm of Doom*, adicionado à campanha:

- 350 seções, mesma transferência de personagem dos livros anteriores.
- Nova arma **Dagger**, disponível na escolha de equipamento deste livro.
- **Equipamento generalizado para "escolha N de uma lista"**: os Livros 2-3 sempre exigiam escolher
  exatamente 2 itens; o Livro 4 exige escolher exatamente 6 de 9. `BookEquipmentConfig` ganha
  `chooseCount` (configurável por livro) no lugar do "2" fixo no código.
- **Poção de Cura vira contador de doses (`healingPotionDoses: number`)** em vez de um par de
  booleanos: a opção de equipamento deste livro concede **2 Potions of Laumspur** de uma vez (os
  Livros 1-3 sempre disseram explicitamente "there is only enough for one dose" — conferido no
  texto original dos três). O modelo antigo só suportava 0 ou 1 dose; o novo suporta qualquer
  quantidade e elimina os dois patches de carry-over que o Livro 3 precisou (um contador atravessa
  entre livros sem tratamento especial).
- Chainmail Waistcoat e Shield reaparecem com os mesmos efeitos já implementados nos Livros 1 e 2
  (nenhuma mecânica nova).
- Auto-concedidos: Map of the Southlands e Badge of Rank (Itens Especiais só descritivos).
- **Achado de arquitetura, sem mudança de código**: este livro restringe a Disciplina Hunting só em
  duas áreas específicas (não o livro inteiro, como o Livro 3), mas isso não exige nenhum código
  novo — a penalidade de Refeição sempre foi aplicada manualmente pelo jogador (`applyMissedMealPenalty`
  nunca é chamada automaticamente em nenhum fluxo do jogo), então o jogador já se orienta pelo
  próprio texto da seção, como sempre fez.
- `SAVE_VERSION` 3 → 4 (mudança de formato da `ActionChart`: `hasHealingPotion`/`hasHealingPotionUsed`
  viram `healingPotionDoses`) — saves anteriores a esta versão deixam de carregar.

## [0.4.0] — 2026-09-13

Livro 3, *The Caverns of Kalte*, adicionado à campanha:

- 350 seções, mesmo padrão de transferência de personagem dos livros anteriores (+1 Disciplina Kai,
  ouro somado, armas/itens especiais mantidos).
- Nova arma **Warhammer** (`ALL_WEAPONS`) e novo Item Especial **Padded Leather Waistcoat** (+2
  Endurance), disponíveis na escolha de equipamento (`choose-two`) deste livro.
- **Potion of Laumspur** (mecanicamente igual à Healing Potion) e **Special Rations** (igual a uma
  Refeição) — mesmos efeitos dos livros anteriores, só com nome próprio deste livro; a Ficha de
  Aventura agora exibe o nome correto por livro em vez do texto fixo "Healing Potion".
- **Regra nova**: neste livro a Disciplina Hunting não isenta de precisar de uma Refeição ("Kalte é
  um deserto gelado", conforme `equipmnt.htm`) — a penalidade de -3 Endurance por falta de Refeição
  agora se aplica mesmo com Hunting, só neste livro.
- Corrigidos dois bugs na Poção de Cura encontrados durante a implementação: (1) transferir
  personagem entre livros reabastecia de graça uma poção já usada; (2) escolher uma poção de cura
  nova deixava-a marcada como "já usada" se a anterior já tivesse sido usada. Agora o estado de uso
  é preservado corretamente entre livros, e uma poção nova sempre vem utilizável.
- Corrigido um terceiro bug descoberto pelo próprio conteúdo do livro: a seção 61 é um final onde
  a missão falha mas o personagem sobrevive (o único caso da série, segundo a nota de rodapé do
  próprio livro) — antes, qualquer seção marcada como final desbloqueava o próximo livro; agora só
  o final canônico (seção 350) conta como conclusão da campanha.

Sem mudança de schema — mesmo `SAVE_VERSION` 3.

## [0.3.0] — 2026-09-13

Armas e Itens Especiais deixam de ser só leitura na Ficha de Aventura:

- **Armas**: agora dá pra adicionar uma arma achada na aventura (lista suspensa com todas as armas
  conhecidas), trocar qual arma está equipada quando se carrega duas, e remover uma (perdida, trocada,
  vendida — venda de ouro continua manual, com os botões +/- de Ouro já existentes).
- **Itens Especiais**: agora dá pra adicionar um item descoberto (nome + efeito conhecido opcional)
  e remover um.
- Corrigido um bug: `addWeapon` permitia adicionar a mesma arma duas vezes, o que deixava as duas
  cópias marcadas como "(equipada)" ao mesmo tempo (só existe um `equippedWeapon`, não por
  instância). Agora adicionar uma arma já carregada não faz nada.

Sem mudança de schema — mesmo `SAVE_VERSION` 3.

## [0.2.0] — 2026-09-13

Fecha lacunas da Ficha de Aventura (Action Chart) identificadas ao comparar com o chart real do
livro (`action.htm`, só disponível como imagem):

- **Rank** (Levels of Kai Training) agora é calculado a partir da quantidade de Disciplinas Kai e
  exibido na Ficha e na criação de personagem.
- **Itens Especiais** passam a ter descrição e efeito conhecido (`SpecialItem { name, description?,
  knownEffects? }`), não só um nome solto.
- **Refeições** ganham contagem própria (`meals: number`), separada da lista genérica de itens da
  mochila, embora ainda contem para o limite compartilhado de 8.
- `SAVE_VERSION` 2 → 3 (mudança de formato da `ActionChart`) — saves anteriores a esta versão
  deixam de carregar.

## [0.1.0] — 2026-09-13

Primeira versão jogável de ponta a ponta.

- Livro 1, *Flight from the Dark*, completo (350 seções, combate automático contra a Combat Results
  Table, disciplinas Kai, equipamento, save local).
- Livro 2, *Fire on the Water*, completo, com tela de seleção de livros, transferência de
  personagem entre livros e progressão de campanha.
- Save na nuvem (API Node/Express + Postgres) via código de 8 caracteres, sem autenticação.
- Deploy em Kubernetes (K3s) via GitOps com ArgoCD, publicado em `http://lonewolf.local`.
- Pipeline CI/CD (`developer` → `main`) com build, testes e publicação de imagem para
  `ghcr.io/dufelizardo/lonewolf` e `lonewolf-api`.
