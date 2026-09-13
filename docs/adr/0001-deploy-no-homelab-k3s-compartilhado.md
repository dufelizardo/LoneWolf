# 0001 — Deploy do LoneWolf no home-lab K3s compartilhado com o mais_saude_publica

## Status

**Aceita.** Manifests do Kubernetes, Dockerfiles e pipelines de CI/CD (`ci.yml`, `publish-image.yml`)
já estão neste repositório e prontos. Falta executar o bootstrap manual no cluster — registrar o
`Application` do ArgoCD, criar o Secret do Postgres, adicionar a entrada no `hosts` — ver a seção
"Deploy (Kubernetes + ArgoCD)" do `README.md`. Depende de acesso à máquina `projetos-server`
(`192.168.0.50`), fora do alcance desta sessão de desenvolvimento.

## Contexto

LoneWolf é um jogo pessoal (adaptação web do livro-jogo *Flight from the Dark*), sem usuários
externos além do autor e da filha dele, jogado dentro da rede de casa. Precisava de um lugar pra
rodar os 3 componentes (frontend estático, API de save na nuvem, Postgres) sem custo e sem esforço
de operação desproporcional ao tamanho do projeto.

Nesse mesmo período, o projeto irmão
[`mais_saude_publica`](https://github.com/dufelizardo/mais_saude_publica) já tinha resolvido
exatamente esse problema pra si mesmo: um servidor doméstico (laptop Acer Aspire 5, ver
[ADR-0012](https://github.com/dufelizardo/mais_saude_publica/blob/main/docs/adr/0012-infraestrutura-local-k3s-homelab.md)
daquele repositório) rodando K3s + MetalLB + Traefik (embutido) + ArgoCD (Core), com GitOps a
partir do próprio Git, sem SSH, sem custo de nuvem. O hardware tinha folga real medida (3,9 GB de
RAM disponíveis com os 4 ambientes daquele projeto já rodando).

A alternativa "óbvia" seria hospedar em serviços de nuvem gratuitos (Vercel/Netlify pro frontend,
Render/Railway pra API, Supabase/Neon pro Postgres) — mas isso significaria manter 3 contas de
serviços externos separados, sujeitos a limites de plano free e risco de expiração. O próprio
mais_saude_publica já teve essa experiência ruim com o Render (registrada na ADR-0012 dele), só
pra um jogo pessoal de baixíssimo tráfego.

## Decisão

Reaproveitar o **mesmo cluster K3s do home-lab** já provisionado para o `mais_saude_publica`, em
vez de criar infraestrutura nova ou usar serviços de nuvem externos.

- Namespace próprio (`lonewolf`), isolado dos namespaces do outro projeto (`mais-saude-*`) no
  mesmo cluster.
- Mesmo Ingress Controller (Traefik, já embutido no k3s) e o mesmo IP compartilhado do MetalLB
  (`192.168.0.200`) — um hostname próprio (`lonewolf.local`) e um único `Ingress` roteando por
  path (`/api` → serviço da API, `/` → serviço do frontend), evitando precisar de um segundo IP do
  pool do MetalLB.
- Mesmo modelo de GitOps via ArgoCD (Core) que já roda naquele cluster — nenhum controller novo
  instalado, só mais um `Application` apontando pro repositório do LoneWolf.
- Mesmo padrão de publicação de imagem: `ghcr.io`, pública, `GITHUB_TOKEN` padrão do próprio
  Actions, sem SSH e sem PAT.
- Senha do Postgres nunca vai pro Git (repositório é público) — criada manualmente via
  `kubectl create secret`, mesmo padrão do outro projeto.

## Arquitetura

| Componente | Stack | Porta interna | Réplicas |
|---|---|---|---|
| `lonewolf` (frontend) | React + TypeScript + Vite, servido por Nginx | 8080 | 1 |
| `lonewolf-api` | Node.js + Express | 3000 | 1 |
| `lonewolf-postgres` | `postgres:16-alpine` | 5432 (ClusterIP interno, nunca exposto) | 1 |

Orçamento de recursos (requests): 64Mi + 64Mi + 128Mi = 256Mi de RAM — bem abaixo da folga de
3,9 GB medida no cluster antes deste projeto entrar.

## Trade-offs considerados

**Reaproveitar o home-lab K3s existente (escolhida)**
- ✅ Custo zero, nenhum serviço de nuvem novo pra gerenciar ou que possa expirar/mudar de plano
  sem aviso.
- ✅ Mesmo padrão de GitOps já validado e documentado (ADR-0012 do mais_saude_publica) — sem curva
  de aprendizado nova.
- ✅ Nenhuma peça de infraestrutura nova instalada no cluster (Traefik, MetalLB e ArgoCD já
  existiam).
- ❌ Dois projetos agora competem pelo mesmo hardware doméstico modesto (AMD A12-9720P, ~6,7 GB
  RAM real) — se o mais_saude_publica crescer, a folga disponível pro LoneWolf (e vice-versa)
  diminui.
- ❌ Um problema no cluster compartilhado (o servidor cair, uma reformatação) agora afeta os dois
  projetos ao mesmo tempo, não só um.

**Serviços de nuvem gratuitos externos — Vercel/Render/Supabase (rejeitada)**
- ✅ Isolamento total do outro projeto; não compete por recursos do mesmo hardware.
- ✅ Não depende do laptop-servidor estar ligado em casa.
- ❌ Rejeitada: 3 contas/serviços externos separados pra manter, sujeitos a limite de plano free e
  risco de expiração — exatamente o problema que o próprio mais_saude_publica já teve com o Render
  (ADR-0012) e decidiu evitar.
- ❌ Sem valor de aprendizado adicional (diferente do K3s, que era um objetivo explícito no outro
  projeto).

## Consequências

**Positivas**
- Deploy funcional sem custo, reaproveitando 100% da infraestrutura e do conhecimento operacional
  já existente.
- Pipeline consistente com o padrão do mais_saude_publica: build → publish em `ghcr.io` → ArgoCD
  sincroniza sozinho, sem SSH em nenhum ponto.
- Path-based routing no mesmo Ingress compartilhado evita gastar um segundo IP do pool limitado do
  MetalLB (`192.168.0.200-192.168.0.210`).

**Negativas / pendências**
- **Mesma lacuna de tag móvel do mais_saude_publica**: o Deployment referencia `:main` (tag
  móvel); o ArgoCD não detecta sozinho quando o *digest* por trás da tag muda, só quando o
  manifest do Git muda. Hoje contornado com `kubectl rollout restart` manual após cada
  `publish-image.yml`; resolver com Argo CD Image Updater ou tags por commit fica em aberto para
  os dois projetos.
- **Save na nuvem sem autenticação** (qualquer um com o código de 8 caracteres acessa o save) —
  aceitável apenas enquanto o Ingress ficar restrito à LAN de casa; se o domínio algum dia for
  exposto à internet, isso precisa ser revisto antes.
- **Sem `startupProbe` na API** — `readinessProbe`/`livenessProbe` com `initialDelaySeconds` curto
  (3s/5s). Risco menor que o caso do mais_saude_publica (Node + Postgres Alpine sobem rápido), mas
  ainda não testado no hardware real; se causar crash-loop no primeiro deploy, o `startupProbe`
  adicionado na ADR-0012 do mais_saude_publica (`failureThreshold`/`periodSeconds`) é o precedente
  a seguir.
- Bootstrap manual no cluster (registrar `Application`, criar Secret, atualizar `hosts`) ainda não
  executado — depende de acesso à máquina `projetos-server`.
