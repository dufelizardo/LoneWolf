# Lone Wolf: Flight from the Dark

Duas pastas neste repositório:

- **`en/`** — conteúdo original do [Project Aon](https://www.projectaon.org/) (edição XHTML aberta do
  livro-jogo *Flight from the Dark*, de Joe Dever e Gary Chalk). Não é modificado nem redistribuído por
  este projeto — é lido localmente, em build-time, pelo pipeline de conteúdo em `app/scripts/`. A
  distribuição deste material segue os termos em `en/xhtml/lw/01fftd/license.htm`.
- **`app/`** — o jogo web (React + TypeScript + Vite) que transforma esse conteúdo em uma aventura
  jogável, com ficha de personagem completa, combate automático contra a Combat Results Table e
  disciplinas Kai.

## Rodando o jogo

```bash
cd app
npm install
npm run dev
```

`npm run dev` (e `npm run build`) rodam automaticamente `npm run parse-content`, que lê os 350 arquivos
`sect*.htm` de `en/xhtml/lw/01fftd/` e gera `app/src/data/sections.json`.

Para rodar os testes automatizados (motor de jogo + validação do conteúdo parseado):

```bash
npm test
```

## Nota sobre a Combat Results Table

A tabela real do livro (`en/xhtml/lw/01fftd/crtneg.png` / `crtpos.png`) só existe como imagem. O arquivo
`app/src/data/crt.ts` reconstrói essa tabela a partir dos pontos claramente legíveis nas imagens (as
células "K" de morte automática e a coluna de Combat Ratio = 0, compartilhada entre as duas metades),
mantendo as mesmas propriedades de crescimento monótono do original. Células internas podem diferir em
1-2 pontos do livro impresso — para números fiéis ao original, compare `crt.ts` com as duas imagens e
ajuste as constantes lá descritas.
