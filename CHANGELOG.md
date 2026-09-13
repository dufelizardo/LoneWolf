# Changelog

Este projeto usa [Semantic Versioning](https://semver.org/). `app/` e `api/` são versionados juntos
(sempre lançados/publicados como um par) — a versão exibida no rodapé do app e em `GET /healthz` da
API deve ser sempre a mesma.

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
