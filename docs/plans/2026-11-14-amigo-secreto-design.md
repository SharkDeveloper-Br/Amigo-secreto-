# Amigo Secreto — Design

Data: 2026-11-14

## Objetivo

Sistema web para organizar amigo secreto. Organizador cria grupo, adiciona
pessoas, define exclusões e sorteia. Cada pessoa recebe um link secreto,
vê só quem tirou e a lista de desejos dessa pessoa. Sem login.

## Decisões

| Tema | Escolha |
|---|---|
| Revelar resultado | Link secreto por pessoa (token aleatório) |
| Funções extras | Lista de desejos, regras de exclusão |
| Stack | Next.js (App Router) + TypeScript + Tailwind, deploy na Vercel |
| Banco | Postgres (Supabase ou Neon) via Prisma |
| Testes | Vitest (unidade) + Playwright (fluxo ponta a ponta) |

## Fluxo

1. **Criar grupo** — `/` → organizador digita nome do grupo e nomes dos
   participantes (mínimo 3). Recebe link de admin `/g/[adminToken]`.
2. **Admin** — `/g/[adminToken]`
   - Edita participantes (antes do sorteio).
   - Adiciona exclusões: "A não pode tirar B" (opção "e vice-versa").
   - Botão **Sortear**. Depois do sorteio, lista fica travada.
   - Vê os links de cada participante para copiar/enviar (WhatsApp).
   - Organizador **não** vê quem tirou quem.
   - Opção **Refazer sorteio** (gera tudo de novo).
3. **Participante** — `/p/[token]`
   - Antes do sorteio: "Sorteio ainda não feito" + edita sua lista de desejos.
   - Depois: mostra "Você tirou: **Nome**" (com botão revelar) + lista de
     desejos do amigo + edita a própria lista.

## Modelo de dados

```
Group        id, name, adminToken (unique), drawnAt?, createdAt
Participant  id, groupId, name, token (unique), wishlist (text),
             assignedToId? (Participant)
Exclusion    id, groupId, giverId, receiverId
```

- Tokens: 24 bytes de `crypto.randomBytes`, base64url. Nunca sequenciais.
- `assignedToId` só é lido na página do próprio participante.

## Algoritmo de sorteio (`lib/draw.ts`)

Função pura: `draw(ids: string[], exclusions: [giver, receiver][], rng) → Map<giver, receiver>`

- Ninguém tira a si mesmo.
- Respeita todas as exclusões.
- Backtracking com ordem embaralhada → resultado aleatório e sempre acha
  solução se ela existir.
- Se impossível → erro `ImpossibleDrawError` com mensagem clara na tela.
- `rng` injetável para testes determinísticos.

## Segurança

- Toda leitura/escrita passa por Server Actions / Route Handlers; banco nunca
  exposto ao cliente.
- Participante só consegue ler: próprio nome, própria lista, nome e lista do
  amigo sorteado.
- Validação de entrada com Zod (tamanho de nome, lista de desejos ≤ 2000 chars).
- Rate limit simples nas rotas de criação.

## Erros

- Token inválido → página 404 genérica (não revela se grupo existe).
- Sorteio impossível → mensagem dizendo qual regra trava.
- Menos de 3 pessoas → botão sortear desabilitado.

## Testes

- `draw.test.ts`: sem auto-sorteio, respeita exclusões, detecta impossível,
  todos dão e recebem exatamente uma vez, distribuição aleatória.
- Testes de server actions com banco de teste.
- Playwright: criar grupo → sortear → abrir link de participante.

## Fora do escopo (por agora)

- Login, e-mail automático, vários organizadores, chat anônimo.
