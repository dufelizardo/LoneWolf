# Lone Wolf

[![CI](https://github.com/dufelizardo/LoneWolf/actions/workflows/ci.yml/badge.svg)](https://github.com/dufelizardo/LoneWolf/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/dufelizardo/LoneWolf?label=release)](https://github.com/dufelizardo/LoneWolf/releases)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-B73BFE?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Kubernetes](https://img.shields.io/badge/Kubernetes-ArgoCD-326CE5?logo=kubernetes&logoColor=white)

Adaptação web da série de livros-jogo *Lone Wolf* (Joe Dever e Gary Chalk), com progressão entre
livros: cada livro só é jogável depois que o anterior é concluído (final canônico), e o personagem
é transferido de um livro para o outro seguindo as regras reais da série (ver ADR-0004).

Pastas neste repositório:

- **`kai/<id>/en/`** — conteúdo original do [Project Aon](https://www.projectaon.org/) (edição XHTML
  aberta), um por livro. `kai/` agrupa a série Kai/Lone Wolf; cada `<id>` é um livro, registrado em
  `app/src/data/books.ts`:
  - `kai/ft/en/` — Livro 1, *Flight from the Dark* (`xhtml/lw/01fftd/`).
  - `kai/fa/en/` — Livro 2, *Fire on the Water* (`xhtml/lw/02fotw/`).

  Não é modificado nem redistribuído por este projeto — é lido localmente, em build-time, pelo
  pipeline de conteúdo em `app/scripts/`. A distribuição deste material segue os termos no
  `license.htm` de cada livro.
- **`app/`** — o jogo web (React + TypeScript + Vite) que transforma esse conteúdo em uma aventura
  jogável, com ficha de personagem completa, combate automático contra a Combat Results Table e
  disciplinas Kai.
- **`api/`** — serviço Node.js + Express + Postgres para salvar o progresso na nuvem (ver seção
  "Save na nuvem" abaixo).

## Rodando o jogo

```bash
cd app
npm install
npm run dev
```

`npm run dev` (e `npm run build`) rodam automaticamente `npm run parse-content`, que lê os 350
arquivos `sect*.htm` de cada livro registrado em `app/src/data/books.ts` e gera
`app/src/data/sections.<id>.json` (um por livro) e `app/src/data/book-intros.json` (a introdução
"Story So Far" de cada um). Para adicionar um livro novo: soltar o conteúdo em `kai/<id>/en/...`,
adicionar uma entrada em `books.ts` e rodar o parser de novo.

Para rodar os testes automatizados (motor de jogo + validação do conteúdo parseado):

```bash
npm test
```

## Save na nuvem (API + Postgres)

O jogo sempre salvou o progresso só no `localStorage` do navegador. Agora existe também um save na
nuvem, para continuar em outro aparelho: ao clicar "Salvar na Nuvem" a primeira vez, o servidor gera um
**código de save** (8 caracteres) mostrado na tela; digite esse código em outro aparelho e clique
"Carregar da Nuvem". **Não há login/senha** — qualquer um com o código acessa aquele save. Isso é
aceitável porque o jogo só roda na LAN de casa (`lonewolf.local`), nunca exposto à internet.

O serviço `api/` expõe:
- `POST /api/saves` — cria um save novo, retorna `{ code }`.
- `GET /api/saves/:code` — retorna `{ chart }` ou 404.
- `PUT /api/saves/:code` — atualiza um save existente.
- `GET /healthz` — usado pelas probes do Kubernetes.

Variáveis de ambiente da API: `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `PORT` (padrão
`3000`). Rodando local:

```bash
cd api
npm install
PGHOST=localhost PGUSER=lonewolf PGPASSWORD=lonewolf PGDATABASE=lonewolf npm run dev
```

## Container / Docker

```bash
cd app
docker build -t lonewolf:local .
docker run --rm -p 8080:8080 lonewolf:local
# abrir http://localhost:8080
```

O `Dockerfile` do `app/` é multi-stage: builda o app com Node e serve os arquivos estáticos gerados via
Nginx (`nginx.conf`), escutando na porta `8080`. O `api/Dockerfile` é semelhante, mas roda `node
dist/index.js` na porta `3000`.

## CI/CD

- **`.github/workflows/ci.yml`**: em todo push/PR para `main`, instala dependências, roda o parser de
  conteúdo, o build de produção, os testes (Vitest) e um build Docker de verificação.
- **`.github/workflows/publish-image.yml`**: em todo push em `main`, builda e publica a imagem em
  `ghcr.io/dufelizardo/lonewolf` (tags `main`, `latest` e `<sha>` — a tag por branch segue a mesma
  convenção do `mais_saude_publica`), imagem pública, sem segredos adicionais (usa o `GITHUB_TOKEN`
  padrão do próprio Actions). Em seguida, o job `pin-manifests` atualiza `k8s/base/deployment.yaml` e
  `api-deployment.yaml` pra apontar pra tag `:<sha>` desse build e commita a mudança direto em
  `main` — é isso que faz o ArgoCD perceber uma diferença real e fazer o rollout sozinho (ver seção
  de Deploy abaixo).

## Deploy (Kubernetes + ArgoCD)

O deploy segue o mesmo modelo GitOps do projeto
[`mais_saude_publica`](https://github.com/dufelizardo/mais_saude_publica): sem SSH, sem Docker Compose —
o ArgoCD, rodando dentro do cluster K3s, observa este repositório e aplica os manifests em `k8s/base/`
sozinho (`syncPolicy.automated: {prune: true, selfHeal: true}`).

Os manifests (`k8s/base/deployment.yaml`, `service.yaml`, `ingress.yaml`, `kustomization.yaml`) e o
`k8s/argocd-app.yaml` (o recurso `Application` do ArgoCD) já estão neste repositório. **Esta sessão não
tem acesso à rede local do servidor (`projetos-server`, 192.168.0.50) nem ao cluster K3s** — os passos
abaixo precisam ser executados por quem tiver acesso a essa máquina/cluster:

```bash
# 0. Se este for o primeiro Application do ArgoCD Core aplicado neste cluster,
#    confirme que o AppProject "default" existe — o ArgoCD Core não cria um
#    sozinho, e sem ele o Application trava em Sync Status "Unknown"
#    (mesmo problema documentado na ADR-0012 do mais_saude_publica; se o cluster
#    já roda o mais_saude_publica, isso já deve estar resolvido).
kubectl get appproject default -n argocd

# 1. Registrar a aplicação no ArgoCD (uma vez só)
kubectl apply -f k8s/argocd-app.yaml

# 2. Criar a senha do Postgres (uma vez só) — NÃO é commitada no repositório público,
#    então precisa existir no cluster antes do Deployment do Postgres/API funcionar.
#    (troque SENHA-AQUI por uma senha real; o namespace lonewolf é criado pelo
#    próprio ArgoCD no passo 1, com CreateNamespace=true)
kubectl create secret generic lonewolf-postgres-secret \
  --namespace lonewolf \
  --from-literal=POSTGRES_PASSWORD='SENHA-AQUI'

# 3. Resolver o domínio local (mesmo padrão do *.mais-saude.local),
#    usando o IP do Traefik/MetalLB (192.168.0.200 neste cluster)
echo "192.168.0.200 lonewolf.local" | sudo tee -a /etc/hosts

# 4. Acessar
curl http://lonewolf.local
curl -X POST http://lonewolf.local/api/saves -H "Content-Type: application/json" -d '{}'
```

(`/healthz` só é usado internamente pelas probes do Kubernetes, não é roteado pelo Ingress.)

A partir daí, todo push em `main` gera uma nova imagem `:main`/`:latest`/`:<sha>` via
`publish-image.yml`, o job `pin-manifests` atualiza os dois `image:` pra `:<sha>` e commita, e o
ArgoCD reconcilia o Deployment sozinho ao ver essa mudança real no Git — sem SSH, sem restart manual.

**Resolvido** (era um ponto em aberto — ver ADR-0001/ADR-0003): antes disso, o Deployment referenciava
só a tag móvel `:main`, e o `syncPolicy.automated.selfHeal` do ArgoCD não percebia sozinho que a
imagem tinha mudado (só reage a divergência no *texto* dos manifests, não a um novo digest atrás da
mesma tag) — por isso era preciso rodar `kubectl rollout restart` manualmente após cada deploy. Pinar
os manifests na tag `:<sha>` de cada build faz o texto do Git mudar de verdade a cada push, o que é o
gatilho que o ArgoCD precisa.

## Nota sobre a Combat Results Table

A tabela real do livro (`kai/ft/en/xhtml/lw/01fftd/crtneg.png` / `crtpos.png`) só existe como imagem. O arquivo
`app/src/data/crt.ts` reconstrói essa tabela a partir dos pontos claramente legíveis nas imagens (as
células "K" de morte automática e a coluna de Combat Ratio = 0, compartilhada entre as duas metades),
mantendo as mesmas propriedades de crescimento monótono do original. Células internas podem diferir em
1-2 pontos do livro impresso — para números fiéis ao original, compare `crt.ts` com as duas imagens e
ajuste as constantes lá descritas.
