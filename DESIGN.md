# DESIGN.md — Amigo Secreto

Guia visual do sistema. Todo componente novo segue este arquivo.

## Clima

**Natal festivo, mas leve.** Papel de presente, fita, etiqueta de presente.
Calor de fim de ano sem poluição: muito espaço, pouca decoração, uma
surpresa boa na hora de revelar o amigo.

Palavras-chave: acolhedor · festivo · simples · secreto.

## Cores

Tokens em CSS (`app/globals.css`) e expostos no Tailwind via `@theme`.
Modo escuro automático (`prefers-color-scheme`). Todos os pares de texto
abaixo passam WCAG AA (≥ 4.5:1).

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | `#FBF7F0` | `#0F1A15` | Fundo da página (papel creme / pinheiro noite) |
| `--surface` | `#FFFFFF` | `#17251E` | Cards, inputs |
| `--text` | `#1F2A24` | `#F3EDE2` | Texto principal |
| `--muted` | `#5B6B62` | `#A9B5AD` | Texto secundário, dicas |
| `--border` | `#E6DCCB` | `#2A3A31` | Bordas, divisórias |
| `--primary` | `#B3261E` | `#C9302A` | Botão principal (vermelho Natal) |
| `--on-primary` | `#FFFFFF` | `#FFFFFF` | Texto sobre primário |
| `--primary-hover` | `#8F1D17` | `#A82721` | Hover/pressed |
| `--link` | `#B3261E` | `#F07A72` | Links e texto em vermelho |
| `--secondary` | `#1E5B3F` | `#5FB58A` | Verde pinheiro: sucesso, botão secundário |
| `--on-secondary` | `#FFFFFF` | `#0F1A15` | Texto sobre secundário |
| `--gold` | `#C8962E` | `#E3B75A` | **Só decoração** (fita, ícones, anel de foco) |
| `--gold-text` | `#8A6414` | `#E3B75A` | Texto dourado (contraste AA) |
| `--danger` | `#B3261E` | `#F07A72` | Erros |

Regras:
- Vermelho = ação. Um botão primário por tela.
- Verde = confirmação/sucesso.
- Dourado nunca como texto pequeno no claro (use `--gold-text`).

## Tipografia

Via `next/font/google`.

| Papel | Fonte | Peso | Tamanho |
|---|---|---|---|
| Título da página | Fraunces | 600 | 32px / 1.15 (mobile 28px) |
| Título de seção | Fraunces | 600 | 22px / 1.25 |
| Corpo | Inter | 400 | 16px / 1.5 |
| Rótulo / botão | Inter | 600 | 15px / 1.2 |
| Pequeno | Inter | 400 | 13px / 1.4 |
| Nome revelado | Fraunces | 700 | 40px / 1.1 |

Números e tokens de link: `font-variant-numeric: tabular-nums`.

## Espaço e forma

- Escala de espaço base 4px: 4, 8, 12, 16, 24, 32, 48, 64.
- Largura máxima do conteúdo: **640px**, centrado. Margem lateral 16px.
- Raio: inputs/botões `10px`, cards `16px`, chips `999px`.
- Sombra única: `0 1px 2px rgb(0 0 0 / .06), 0 4px 16px rgb(0 0 0 / .06)`.
  No escuro, sem sombra; usar borda.

## Componentes

**Button** — `primary` (vermelho), `secondary` (verde), `ghost` (texto).
Altura mínima 44px. Estado carregando com spinner e texto mantido.
Desabilitado: opacidade 50%, sem hover.

**Input / Textarea** — fundo `--surface`, borda `--border`, foco com anel
dourado 2px + offset 2px. Rótulo sempre visível acima (nunca só
placeholder). Erro: borda e mensagem `--danger` abaixo.

**Card** — `--surface`, raio 16px, padding 24px (mobile 16px).

**GiftTag** (card de participante) — card com recorte de etiqueta no canto
e furinho com fita dourada. Mostra nome + ação (copiar link).

**ParticipantChip** — pílula com nome e botão ✕ para remover. Usada na tela
de criar grupo.

**ExclusionRow** — "Ana ✕→ Bruno" com select de duas pessoas e checkbox
"e vice-versa".

**RevealGift** (estrela do sistema) — caixa de presente fechada com fita.
Toque/clique em "Abrir presente" → tampa sobe, nome aparece em Fraunces 40px,
confete dourado/vermelho leve. Anúncio via `aria-live="polite"`.
Com `prefers-reduced-motion`: sem animação, só troca para o nome.

**Wishlist** — textarea com contador de caracteres (máx. 2000) e botão
salvar; mostra "Salvo ✓" em verde por 2s.

**Toast** — canto inferior, some em 3s. Para "Link copiado!".

**EmptyState** — ícone simples + uma frase + uma ação.

## Ícones e decoração

- Ícones: `lucide-react`, traço 1.75, 20px. (Gift, Copy, Check, X, Users,
  Shuffle, Lock.)
- Decoração: flocos de neve SVG bem sutis no topo da página (opacidade 8%),
  sem imagens pesadas. Nada piscando.

## Movimento

- Duração: 150ms (hover), 250ms (entrada), 600ms (abrir presente).
- Easing: `cubic-bezier(.2,.8,.2,1)`.
- Respeitar `prefers-reduced-motion: reduce` em tudo.

## Acessibilidade

- Contraste AA em todo texto (tabela acima verificada).
- Foco sempre visível (anel dourado).
- Alvo de toque ≥ 44×44px.
- Tudo funciona por teclado; ordem de tab lógica.
- `lang="pt-BR"`; textos de botão descrevem a ação.

## Voz e texto

Português do Brasil, caloroso e curto. Fala "você".

| Situação | Texto |
|---|---|
| Título inicial | "Bora organizar o amigo secreto?" |
| Botão criar | "Criar grupo" |
| Botão sortear | "Sortear agora" |
| Antes do sorteio (participante) | "O sorteio ainda não rolou. Aproveita e escreve sua lista de desejos!" |
| Revelar | "Abrir presente" → "Você tirou **{nome}** 🎁" |
| Sorteio impossível | "Com essas regras não dá pra sortear. Tira alguma exclusão e tenta de novo." |
| Link inválido | "Esse link não existe ou expirou." |
| Aviso de segredo | "Não mostra essa tela pra ninguém 🤫" |

## Telas

1. **Início `/`** — título, campo nome do grupo, campo para adicionar
   participantes (Enter adiciona chip), botão "Criar grupo".
2. **Admin `/g/[token]`** — nome do grupo; lista de GiftTags; seção
   exclusões; botão "Sortear agora"; após sorteio, cada GiftTag ganha botão
   "Copiar link" e "Enviar no WhatsApp". Aviso: "Guarde este link, é o
   único jeito de voltar aqui."
3. **Participante `/p/[token]`** — saudação "Oi, {nome}!"; RevealGift;
   lista de desejos do amigo; sua própria Wishlist.
4. **404** — EmptyState com link para o início.
