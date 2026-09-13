# 0004 — Múltiplos livros da série e progressão de campanha

## Status

**Implementada.** Livro 2 (*Fire on the Water*) jogável de ponta a ponta: pipeline por livro,
tela de seleção/introdução, transferência de personagem (disciplina extra, equipamento
`choose-two`, item Escudo) validados via Playwright — desbloqueio ao concluir a seção 350 do
Livro 1, ficha corretamente herdada + somada na entrada do Livro 2. Mergeado em `main`
(PR #2) e publicado via `publish-image.yml`.

**Atualização:** Livro 3 (*The Caverns of Kalte*) adicionado reaproveitando 100% desta
arquitetura — só dados novos (`books.ts`, `bookEquipment.ts`), nenhuma mudança em
`parseContent.ts` nem no motor de combate/disciplinas além do apontado na seção "Atualização —
Livro 3" abaixo. Ver essa seção para os dois ajustes de motor que o conteúdo do Livro 3 forçou.

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

## Atualização — Livro 3 (Caverns of Kalte)

Confirma o trade-off "só cobre os dois modos observados até agora": o Livro 3 usa `choose-two`
igual ao Livro 2 (8 armas + Padded Leather Waistcoat + Potion of Laumspur + Special Rations), sem
precisar de um terceiro `equipmentMode`. Mesmo assim, o conteúdo real do livro forçou duas
generalizações que não existiam antes:

- **`healingPotionLabel` e `huntingDisabled` em `BookEquipmentConfig`**: a "Poção de Cura" tem nome
  próprio por livro (`Healing Potion` em `ft`/`fa`, `Potion of Laumspur` em `tck`, mecanicamente
  idêntica) — a Ficha e a tela de criação agora leem esse nome do registro em vez de um texto fixo.
  E `equipmnt.htm` do Livro 3 diz explicitamente que a Disciplina Hunting **não** isenta de Refeição
  neste livro ("Kalte é um deserto gelado") — `huntingDisabled: true` desliga essa isenção só para
  `tck`, sem afetar `ft`/`fa`.
- **`finalSection` em `BookMeta` — final canônico vs. final não-canônico**: o parser marca uma seção
  como `isEnding` sempre que ela não tem escolhas (sem link pra frente). Isso bastava enquanto cada
  livro só tinha *um* desses finais. O Livro 3 tem dois: a seção 350 (sucesso da missão) e a seção
  61, um final onde o personagem sobrevive mas **falha** a missão — o próprio livro registra em nota
  de rodapé que "this peculiar ending is the only time in the Lone Wolf series where you can fail
  your mission without dying […] you may not continue on to future adventures". Sem distinguir os
  dois, `App.tsx` marcaria o Livro 3 como concluído (e desbloquearia o próximo) mesmo numa seção que
  o próprio texto diz explicitamente que não conclui a aventura. Corrigido comparando
  `section.number` com o novo campo `finalSection` do livro antes de tratar como conclusão de
  campanha — qualquer outro `isEnding` vira um "fim de missão" que não desbloqueia nada, reaproveitando
  a mesma tela de `deadend`.

Também foram corrigidos dois bugs reais na Poção de Cura, achados ao investigar como o estado
"já usada" deveria se comportar atravessando 3 livros: `carryOverCharacterToBook` reabastecia de
graça uma poção já usada a cada transferência de livro, e escolher uma poção nova deixava o
personagem com uma poção "já usada" sem nunca ter usado a nova. Ambos exigiam pensar em 3 livros
em sequência para aparecer — não davam pra notar só com 2.

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
