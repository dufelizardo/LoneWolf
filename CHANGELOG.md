# Changelog

Este projeto usa [Semantic Versioning](https://semver.org/). `app/` e `api/` são versionados juntos
(sempre lançados/publicados como um par) — a versão exibida no rodapé do app e em `GET /healthz` da
API deve ser sempre a mesma.

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
