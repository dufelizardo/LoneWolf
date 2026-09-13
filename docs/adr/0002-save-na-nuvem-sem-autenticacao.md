# 0002 — Save na nuvem via API + Postgres, sem autenticação

## Status

**Aceita e implementada.** API (`api/`), rotas e schema já estão no repositório e cobertos pelo
`ci.yml` (`test-api`). O deploy do serviço em si segue a ADR-0001 (ainda pendente de bootstrap no
cluster).

## Contexto

O jogo sempre salvou o progresso só no `localStorage` do navegador — suficiente pra jogar num
único aparelho, mas sem forma de continuar em outro (ex.: começar no notebook, continuar no
celular). A funcionalidade natural pra resolver isso é um "save na nuvem".

A abordagem padrão pra esse tipo de recurso seria exigir conta de usuário (login/senha ou OAuth),
garantindo que só o dono do save acesse/edite ele. Isso traz complexidade real: hash de senha,
sessão/token, recuperação de conta, tela de cadastro — tudo desproporcional pra um jogo pessoal,
sem usuários externos, que só roda dentro da rede de casa (`lonewolf.local`, nunca exposto à
internet, ver ADR-0001).

## Decisão

Implementar o save na nuvem **sem nenhuma autenticação**, usando um código curto como único
mecanismo de acesso:

- `POST /api/saves` — gera um **código de 8 caracteres** (alfabeto sem caracteres visualmente
  ambíguos: sem `0/O`, `1/I/L` — ver `codeGenerator.ts`), persiste o estado do jogo (`chart`) e
  devolve o código pra tela.
- `GET /api/saves/:code` — devolve o `chart` daquele código, ou 404.
- `PUT /api/saves/:code` — sobrescreve o `chart` de um código existente.
- `GET /healthz` — só pra probes do Kubernetes, não roteado pelo Ingress externo.

Qualquer pessoa com o código acessa e edita aquele save — não existe dono, senha nem expiração.

### Schema (Postgres)

Uma tabela só, sem relacionamento com nenhuma outra — não há necessidade de um DER pra isso:

```sql
CREATE TABLE saves (
  code TEXT PRIMARY KEY,
  chart JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)
```

O estado inteiro do personagem (ficha, disciplinas Kai, inventário, progresso na narrativa) vive
dentro do `chart` (JSONB) — não é normalizado em colunas/tabelas próprias. Isso é intencional: o
formato do `chart` já é definido pelo TypeScript do `app/` (motor de jogo), e replicá-lo como
schema relacional na API duplicaria a modelagem sem trazer benefício (a API nunca consulta o
conteúdo do `chart`, só armazena e devolve).

## Trade-offs considerados

**Código sem autenticação (escolhida)**
- ✅ Zero complexidade de conta de usuário — sem hash de senha, sessão, recuperação de conta.
- ✅ Fricção mínima pra continuar em outro aparelho: só digitar um código de 8 caracteres.
- ✅ Proporcional ao uso real (dentro de casa, poucas pessoas).
- ❌ Qualquer um com o código acessa/edita o save — sem noção de "dono".
- ❌ Não escala pra um cenário exposto à internet: precisaria de rate limiting no mínimo (código de
  8 caracteres num alfabeto de 32 símbolos ainda é um espaço grande, mas força bruta deixa de ser
  teoricamente inviável fora de uma rede fechada).

**Login/senha ou OAuth (rejeitada)**
- ✅ Segurança de verdade, dono explícito de cada save.
- ❌ Rejeitada: complexidade totalmente desproporcional ao contexto (jogo pessoal, LAN de casa, sem
  usuários externos) — nenhum dos riscos que autenticação mitiga (acesso indevido por estranhos)
  se aplica enquanto o serviço não sai da rede local.

## Consequências

**Positivas**
- Recurso entregue com uma API pequena (3 rotas + health check) e um schema trivial.
- Nenhuma dependência nova além do `pg` (driver Postgres) — sem biblioteca de autenticação/sessão.

**Negativas / pendências**
- **Pré-condição de segurança implícita**: esta decisão só é segura enquanto o Ingress do
  `lonewolf.local` continuar restrito à LAN de casa (ver ADR-0001). Se o domínio for exposto à
  internet no futuro, autenticação (ou ao menos rate limiting + expiração de código) precisa ser
  adicionada antes.
- Sem expiração de save — códigos antigos nunca são limpos; o volume esperado (uso pessoal) torna
  isso irrelevante na prática, mas fica registrado como limitação conhecida.
