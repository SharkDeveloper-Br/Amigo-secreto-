# Amigo Secreto 🎁

Organize o amigo secreto sem cadastro: crie o grupo, coloque regras
("casal não tira um ao outro"), sorteie e mande um link secreto para
cada pessoa. Cada um vê só quem tirou e a lista de desejos do amigo.

- Visual: [`DESIGN.md`](DESIGN.md)
- Desenho técnico: [`docs/plans/`](docs/plans)

## Como funciona

| Página | Quem usa | O que faz |
|---|---|---|
| `/` | organizador | cria o grupo com os nomes |
| `/g/[token]` | organizador | regras, sortear, links de cada pessoa |
| `/p/[token]` | participante | abre o presente, vê o amigo e a lista, escreve a própria lista |

O organizador não vê quem tirou quem. Mas ele tem os links de todos,
então em teoria poderia abrir o link de alguém. Escolha um organizador
de confiança (ou que também participe e não espie 😉).

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind 4 ·
Prisma 7 + Postgres · Vitest.

## Rodar local

```bash
cp .env.example .env          # coloque a URL do seu Postgres
npm install
npx prisma migrate dev
npm run dev                   # http://localhost:3000
```

Testes (precisam de um Postgres de teste):

```bash
DATABASE_URL_TEST="postgresql://app:app@localhost:5432/amigo_test" npm test
```

## Deploy na Vercel

1. Crie um banco Postgres grátis (Neon ou Supabase) e copie a URL.
2. Importe este repositório na Vercel.
3. Em **Settings → Environment Variables**, adicione `DATABASE_URL`.
4. Em **Build Command**, use: `npx prisma migrate deploy && next build`.
5. Deploy. Pronto.
