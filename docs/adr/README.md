# Architecture Decision Records (ADR)

Este diretório guarda os registros de decisões de arquitetura do projeto — o "porquê" por trás de escolhas que têm trade-offs relevantes e não são óbvias a partir do código sozinho.

Cada ADR é um arquivo `NNNN-titulo-curto.md`, numerado sequencialmente, seguindo o formato leve de Michael Nygard:

- **Status** — Proposta, Aceita, Rejeitada, Substituída (por qual ADR) ou Obsoleta.
- **Contexto** — o problema, restrição ou situação que motivou a decisão.
- **Decisão** — o que foi decidido.
- **Trade-offs considerados** — as alternativas avaliadas e por que a escolhida venceu.
- **Consequências** — o que essa decisão traz de bom, e o que ela deixa como dívida ou pendência conhecida.

Crie um novo ADR quando uma decisão envolver trade-offs (não para escolhas triviais ou reversíveis a baixo custo), especialmente quando a decisão contraria a alternativa "óbvia" e alguém no futuro provavelmente vai perguntar "por que não fizeram X em vez disso?".

## Índice

| ADR | Título | Status |
|---|---|---|
| [0001](./0001-deploy-no-homelab-k3s-compartilhado.md) | Deploy do LoneWolf no home-lab K3s compartilhado com o mais_saude_publica | Implementada |
| [0002](./0002-save-na-nuvem-sem-autenticacao.md) | Save na nuvem via API + Postgres, sem autenticação | Aceita |
| [0003](./0003-pipeline-developer-main-auto-merge.md) | Pipeline developer→main com gate de CI e auto-merge via PAT | Aceita |
| [0004](./0004-multi-livro-e-progressao-de-campanha.md) | Múltiplos livros da série e progressão de campanha | Implementada |
| [0005](./0005-fase-magnakai-e-sistema-de-disciplinas.md) | Fase Magnakai: disciplinas separadas em vez de unificadas, e reset na fronteira de fase | Implementada |
| [0006](./0006-fase-grand-master-e-disciplinas-em-camadas.md) | Fase Grand Master: disciplinas em camadas (substituição, não zeramento) e novo teto de rank | Implementada |

Ver também o projeto irmão [`mais_saude_publica`](https://github.com/dufelizardo/mais_saude_publica/tree/main/docs/adr), cujas ADRs de infraestrutura (especialmente a 0012) são referenciadas aqui e continuam sendo a fonte de verdade para decisões sobre o cluster K3s compartilhado.
