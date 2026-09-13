# 0004 — Múltiplos livros da série e progressão de campanha

## Status

**Aceita, em implementação.**

## Contexto

O jogo só conhecia um livro (*Flight from the Dark*, id interno `ft`, conteúdo em
`kai/ft/en/xhtml/lw/01fftd/`). Foi adicionado o conteúdo bruto do **Livro 2 da série, *Fire on the
Water*** (`kai/fa/en/xhtml/lw/02fotw/`). Segundo o dono do projeto, a série completa tem pelo menos
7 "estágios", dos quais a fase "Kai" sozinha tem 5 livros — hoje só os livros 1 e 2 entram, mas o
design precisa deixar fácil adicionar os próximos sem reescrever a arquitetura.

Investigação do conteúdo real do Livro 2 (`gamerulz.htm`, `equipmnt.htm`, `discplnz.htm`) confirmou
que a progressão entre livros segue regras específicas do livro-jogo original, não é só "destravar
acesso":

- Quem completou o Livro 1 **transfere** Combat Skill, Endurance, Disciplinas Kai, Armas e Itens
  Especiais para o Livro 2 (em vez de rolar tudo de novo), ainda limitado a 2 armas/8 itens de
  mochila.
- Ganha **exatamente 1** Disciplina Kai nova (de 5 para 6). Quem começa o Livro 2 do zero escolhe 5
  normalmente.
- Ouro sorteado no Livro 2 **soma** ao que já tinha, não substitui.
- O equipamento inicial do Livro 2 é **escolha do jogador entre 2 de 9 itens**, diferente do sorteio
  de 1 item aleatório do Livro 1 — inclui um item novo, **Escudo** (+2 Combat Skill em combate,
  Item Especial), que não existia no vocabulário de itens do Livro 1.

Também foi identificado um risco técnico real: os dois livros têm arquivos de ícone com o **mesmo
nome** (`mace.png`, `sword.png` etc., e principalmente as ilustrações inline `smallN.png`, que quase
certamente têm conteúdo diferente por livro apesar do nome igual). O pipeline de conteúdo copiava
tudo pra uma única pasta `app/public/illustrations/` — isso colidiria e sobrescreveria arte de um
livro com a do outro.

## Decisão

### Registro de livros extensível
`app/src/data/books.ts` passa a ser a fonte da verdade de quais livros existem, cada um com
`id`, `code` (pasta `xhtml/lw/<code>/` de origem), `title`, `order` (define a sequência de
desbloqueio) e `equipmentMode` (`'random-one'` para o Livro 1, `'choose-two'` para o Livro 2).
Adicionar um livro novo no futuro é: soltar o conteúdo em `kai/<id>/en/...`, uma entrada nesse
registro, rodar o parser — sem mudar a lógica de parsing em si (ela já era genérica, só dependia de
um diretório e uma contagem de seções).

### Conteúdo por livro, sem colisão de assets
`parseContent.ts` passa a rodar em loop sobre `BOOKS`, gerando `app/src/data/sections.<id>.json`
por livro (em vez de um `sections.json` único) e copiando ilustrações para
`app/public/illustrations/<id>/` — corrigindo a colisão de nomes. Também extrai o texto de
`tssf.htm` ("Story So Far") de cada livro para `app/src/data/book-intros.json`, usado pela tela de
introdução antes de começar/continuar aquele livro.

### Progresso de campanha reaproveita o save na nuvem existente (sem mudança de schema)
Igual à ADR-0002, a tabela `saves` continua sendo `(code, chart JSONB, updated_at)` — **não há
mudança no banco nem na API**. O que muda é só o formato do JSON que o frontend guarda dentro de
`chart`:

```jsonc
{
  "saveVersion": 2,
  "campaign": {
    "completedBooks": {
      "ft": { /* ActionChart completo no momento em que o Livro 1 foi concluído */ }
    }
  },
  "chart": { /* ActionChart em progresso no livro atual, agora com um campo bookId */ }
}
```

Não é necessário um DER: continua sendo uma tabela sem relacionamento, e o formato interno do JSON
é definido pelo TypeScript do motor de jogo (`ActionChart`/`CampaignProgress` em
`app/src/engine/types.ts`), igual ao raciocínio já registrado na ADR-0002.

### Critério de desbloqueio e transferência de personagem
Um livro de `order = N` só aparece desbloqueado na tela de seleção se o livro de `order = N-1`
estiver em `campaign.completedBooks` — e só entra lá quando o jogador **alcança o final canônico**
da história (seção marcada `isEnding`), nunca por morte ou dead-end. Ao entrar num livro cujo
anterior foi concluído, o jogador escolhe entre "Transferir personagem" (usa a ficha salva em
`completedBooks[idAnterior]`, soma ouro novo, escolhe 1 disciplina nova) ou "Começar do zero"
(ficha nova, 5 disciplinas, equipamento do próprio livro).

## Trade-offs considerados

**Registro de livros + JSON por livro (escolhida)**
- ✅ Adicionar um livro novo não exige mudar a lógica do parser nem do motor de jogo, só dados.
- ✅ Sem colisão de assets entre livros (ilustrações namespaced por `id`).
- ❌ O mapa `bookId → sections.json` no `GameScreen.tsx` ainda é um objeto estático escrito à mão
  (não descoberta automática de pastas) — aceitável para 2 livros, pode precisar revisão se a lista
  crescer muito (vale reavaliar quando os "7 estágios" começarem a virar conteúdo de verdade).

**Guardar `completedBooks` como JSONB opaco dentro do save existente (escolhida)**
- ✅ Zero mudança em `api/`/Postgres/k8s — o mesmo código de save de sempre carrega e persiste o
  progresso de campanha junto com a ficha em jogo.
- ❌ `SAVE_VERSION` precisou subir (de 1 para 2), invalidando saves feitos antes desta mudança —
  aceitável nesta fase do projeto (uso pessoal, poucos saves existentes).

**Modelar equipamento por `equipmentMode` em vez de hardcodar por livro (escolhida)**
- ✅ Livro 1 (sorteio aleatório) e Livro 2 (escolha de 2 itens) coexistem sem duplicar a tela de
  criação de personagem.
- ❌ Só cobre os dois modos observados até agora; um Livro 3 com uma mecânica de equipamento
  totalmente diferente pode exigir um terceiro modo — aceito como extensão futura, não bloqueou
  esta decisão.

## Consequências

**Positivas**
- Livro 2 jogável com as regras reais de transferência de personagem da série, não uma
  simplificação.
- Estrutura pronta para os próximos livros da fase "Kai" (e, mais adiante, outras fases) sem
  reescrever pipeline, motor de jogo ou persistência.

**Negativas / pendências**
- Saves anteriores à ADR (formato `{saveVersion: 1, chart}`) deixam de carregar — sem rota de
  migração automática.
- O bônus de combate do Escudo (`SPECIAL_ITEM_COMBAT_BONUS`) é o primeiro item especial com efeito
  em combate modelado como tabela de dados; itens especiais futuros com efeitos mais elaborados
  (condicionais, por seção) provavelmente vão exigir um modelo mais expressivo do que uma tabela
  fixa de bônus — fica registrado como limitação conhecida, não resolvida aqui.
