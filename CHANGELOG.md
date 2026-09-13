# Changelog

Este projeto usa [Semantic Versioning](https://semver.org/). `app/` e `api/` são versionados juntos
(sempre lançados/publicados como um par) — a versão exibida no rodapé do app e em `GET /healthz` da
API deve ser sempre a mesma.

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
