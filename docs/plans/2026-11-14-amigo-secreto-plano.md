# Amigo Secreto — Plano de implementação

Base: `docs/plans/2026-11-14-amigo-secreto-design.md` e `DESIGN.md`.
Método: TDD (teste falha → código → teste passa → commit).

## Tarefas

1. **Esqueleto** — Next.js 16 (App Router, TS, Tailwind 4), Vitest, ESLint.
   Fontes Fraunces + Inter, tokens de cor do DESIGN.md em `globals.css`.
2. **Sorteio** (`lib/draw.ts`, TDD)
   - ninguém tira a si mesmo; todos dão e recebem 1 vez
   - respeita exclusões; `ImpossibleDrawError` quando não dá
   - rng injetável; menos de 3 pessoas → erro
3. **Tokens** (`lib/token.ts`) — 24 bytes base64url.
4. **Banco** — Prisma 7 + `@prisma/adapter-pg`. Modelos Group, Participant,
   Exclusion. Migração inicial.
5. **Serviço** (`lib/groups.ts`, testes com Postgres real)
   - `createGroup(name, nomes[])`
   - `getAdminView(adminToken)` — sem quem tirou quem
   - `addExclusion / removeExclusion` (+ vice-versa)
   - `addParticipant / removeParticipant` (só antes do sorteio)
   - `runDraw(adminToken)` / refazer
   - `getParticipantView(token)` — só o próprio + amigo
   - `updateWishlist(token, texto)`
   - validação Zod
6. **Componentes UI** — Button, Input, Card, GiftTag, ParticipantChip,
   ExclusionRow, RevealGift, Wishlist, Toast, EmptyState.
7. **Telas** — `/`, `/g/[token]`, `/p/[token]`, 404. Server Actions.
8. **E2E** — Playwright: criar → excluir → sortear → abrir link → revelar.
9. **Deploy** — README com passo a passo Vercel + Neon/Supabase.
