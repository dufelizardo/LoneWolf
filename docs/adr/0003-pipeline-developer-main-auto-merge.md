# 0003 — Pipeline developer→main com gate de CI e auto-merge via PAT

## Status

**Aceita e implementada em código.** `ci.yml` e `auto-merge.yml` já estão no repositório, branch
`developer` criada. Faltam: configurar branch protection na `main` exigindo os checks do `ci.yml`,
e validar o ciclo completo com uma PR real `developer→main`.

## Contexto

Até aqui, o repositório tinha só a branch `main`, com CI (`ci.yml`) e publicação de imagem
(`publish-image.yml`) disparando direto nela. Isso funciona, mas não dá nenhuma barreira entre
"código que ainda está sendo escrito" e "código que vira imagem publicada e é sincronizado pelo
ArgoCD" (ver ADR-0001) — qualquer push na `main`, mesmo quebrado, dispara publicação de imagem.

O projeto irmão [`mais_saude_publica`](https://github.com/dufelizardo/mais_saude_publica) já
resolveu um problema parecido com um fluxo de branches + gate de CI + promoção automática
(ADR-0010 e ADR-0011 daquele repositório). A decisão aqui foi replicar a parte relevante desse
padrão, sem herdar a complexidade que não se aplica ao LoneWolf (múltiplos ambientes
`qaa`/`homologação`, aprovação obrigatória pra colaboradores externos — LoneWolf é um projeto
solo).

## Decisão

- Branch `developer` como destino de todo trabalho em andamento.
- `ci.yml` passa a rodar em push na `developer` (antes só rodava na `main`) e em toda PR aberta
  contra a `main`. Os dois jobs existentes (`test-app`, `test-api`) continuam os mesmos, viram os
  **checks obrigatórios** da promoção.
- Uma PR `developer → main` é o único caminho de promoção. Um novo workflow,
  `auto-merge.yml`, espera `test-app` e `test-api` terminarem com sucesso e mergeia a PR sozinho —
  sem exigir clique manual, mas sem pular nenhum teste.
- `publish-image.yml` continua disparando só em push real na `main` (inalterado) — ou seja, só
  depois do merge automático é que a imagem nova é publicada em `ghcr.io` e o ArgoCD reconcilia.

### Por que precisa de um PAT (`WOLK_KEY`) em vez do `GITHUB_TOKEN` padrão

Este é o ponto menos óbvio da decisão, e o motivo desta ADR existir: o GitHub **não deixa um push
ou merge feito com o token padrão de um workflow (`GITHUB_TOKEN`) disparar outros workflows** —
proteção nativa contra loop infinito (workflow disparando workflow disparando workflow…).

Sem um PAT, `auto-merge.yml` conseguiria mergear a PR normalmente, mas esse merge **não contaria
como um push "de verdade"** para fins de disparar `publish-image.yml` — a imagem nunca seria
publicada, e ninguém perceberia o motivo só olhando os arquivos de workflow (o merge "funciona",
só o passo seguinte silenciosamente nunca dispara). Por isso `auto-merge.yml` usa
`secrets.WOLK_KEY`, um Personal Access Token fine-grained do dono do repositório, só para essa
única chamada de merge.

Diferente do `AUTOMERGE_PAT` do mais_saude_publica, o `WOLK_KEY` **não precisa da permissão
"Administration"** — aquele projeto usa `gh pr merge --admin` pra baipassar uma regra de aprovação
obrigatória pra terceiros (ADR-0011 de lá), que não existe aqui (projeto solo, sem essa regra).
O `WOLK_KEY` só precisa de **Contents: Read and write** e **Pull requests: Read and write**, e o
merge é um `gh pr merge --merge` simples, sem flag de bypass.

## Trade-offs considerados

**Gate de CI + auto-merge com PAT (escolhida)**
- ✅ Nenhum código quebrado chega na `main`/vira imagem publicada sem passar pelos testes.
- ✅ Nenhum clique manual necessário no dia a dia — abrir a PR já é suficiente.
- ✅ Reaproveita um padrão já validado (mesma técnica do mais_saude_publica), sem inventar solução
  nova.
- ❌ Depende de um PAT armazenado como secret — mais uma credencial pra rotacionar/revogar se
  necessário (fine-grained e escopado só a este repositório, o que limita o dano de um vazamento).
- ❌ Mais um workflow pra entender/manter do que simplesmente mergear na mão.

**Merge manual pela interface do GitHub (rejeitada)**
- ✅ Mais simples, sem PAT nenhum — só o `GITHUB_TOKEN` padrão seria suficiente pro `ci.yml`.
- ❌ Rejeitada a pedido explícito do usuário: o objetivo era ter o mesmo fluxo automático do
  mais_saude_publica, não abrir mão da automação por simplicidade.

## Consequências

**Positivas**
- Separação real entre "em desenvolvimento" (`developer`) e "publicado" (`main`), sem esforço
  manual extra no fluxo do dia a dia.
- Mesmo modelo mental do mais_saude_publica — quem conhece um projeto reconhece o outro.

**Negativas / pendências**
- Branch protection na `main` (exigir `test-app`/`test-api` antes de permitir merge) ainda não
  configurada — sem isso, a PR *pode* ser mergeada manualmente mesmo com check falhando, o
  `auto-merge.yml` só controla o caminho automático, não impede o caminho manual.
- ~~Ciclo completo ainda não validado~~ — **validado**: as 4 primeiras PRs (`developer` → `main`)
  precisaram de merge manual porque o `WOLK_KEY` estava sem a permissão de PR necessária; corrigido
  pelo dono do repositório, e a PR #5 já mergeou 100% sozinha via `auto-merge.yml`.
- ~~Mesma lacuna de tag móvel~~ — **resolvida** (ver ADR-0001): `publish-image.yml` agora pina os
  manifests na tag `:<sha>` do build, então o merge automático também já reconcilia o ArgoCD sozinho.
