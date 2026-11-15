import { z } from "zod";
import { db } from "./db";
import { draw, ImpossibleDrawError, NotEnoughPeopleError } from "./draw";
import { InvalidPhoneError, normalizePhone } from "./phone";
import { looksLikeToken, newToken } from "./token";

/** Erro com mensagem que pode ir pra tela. */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export const LIMITS = {
  groupName: 60,
  personName: 40,
  minPeople: 3,
  maxPeople: 100,
  wishlist: 2000,
} as const;

const groupName = z
  .string()
  .trim()
  .min(1, "Dá um nome pro grupo.")
  .max(LIMITS.groupName, `Nome do grupo até ${LIMITS.groupName} letras.`);

const personName = z
  .string()
  .trim()
  .min(1, "Nome vazio.")
  .max(LIMITS.personName, `Nome até ${LIMITS.personName} letras.`);

function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const r = schema.safeParse(value);
  if (!r.success) throw new AppError(r.error.issues[0]?.message ?? "Dado inválido.");
  return r.data;
}

function assertUniqueNames(names: string[]) {
  const seen = new Set<string>();
  for (const n of names) {
    const key = n.toLocaleLowerCase("pt-BR");
    if (seen.has(key)) throw new AppError(`"${n}" aparece duas vezes.`);
    seen.add(key);
  }
}

function parsePhone(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") throw new AppError("Telefone inválido.");
  try {
    return normalizePhone(raw);
  } catch (e) {
    if (e instanceof InvalidPhoneError) throw new AppError(e.message);
    throw e;
  }
}

export type NewPerson = string | { name: string; phone?: string | null };

async function findGroup(adminToken: string) {
  if (!looksLikeToken(adminToken)) return null;
  return db.group.findUnique({ where: { adminToken } });
}

async function requireGroup(adminToken: string) {
  const g = await findGroup(adminToken);
  if (!g) throw new AppError("Esse link não existe ou expirou.");
  return g;
}

async function requireOpenGroup(adminToken: string) {
  const g = await requireGroup(adminToken);
  if (g.drawnAt) throw new AppError("Sorteio já feito. Desfaça o sorteio pra editar.");
  return g;
}

// ---------- criar ----------

export async function createGroup(input: { name: string; participants: NewPerson[] }) {
  const name = parse(groupName, input.name);
  const people = input.participants.map((p) =>
    typeof p === "string"
      ? { name: parse(personName, p), phone: null }
      : { name: parse(personName, p?.name), phone: parsePhone(p?.phone) },
  );
  if (people.length > LIMITS.maxPeople)
    throw new AppError(`Máximo de ${LIMITS.maxPeople} pessoas.`);
  assertUniqueNames(people.map((p) => p.name));

  const adminToken = newToken();
  await db.group.create({
    data: {
      name,
      adminToken,
      inviteToken: newToken(),
      participants: {
        create: people.map((p) => ({ name: p.name, phone: p.phone, token: newToken() })),
      },
    },
  });
  return { adminToken };
}

// ---------- admin ----------

export type AdminView = {
  name: string;
  drawn: boolean;
  inviteToken: string;
  participants: { id: string; name: string; token: string; phone: string | null }[];
  exclusions: {
    id: string;
    giverId: string;
    giverName: string;
    receiverId: string;
    receiverName: string;
  }[];
};

export async function getAdminView(adminToken: string): Promise<AdminView | null> {
  if (!looksLikeToken(adminToken)) return null;
  const g = await db.group.findUnique({
    where: { adminToken },
    select: {
      id: true,
      name: true,
      drawnAt: true,
      inviteToken: true,
      participants: {
        select: { id: true, name: true, token: true, phone: true },
        orderBy: { createdAt: "asc" },
      },
      exclusions: {
        select: {
          id: true,
          giverId: true,
          receiverId: true,
          giver: { select: { name: true } },
          receiver: { select: { name: true } },
        },
        orderBy: { id: "asc" },
      },
    },
  });
  if (!g) return null;
  let inviteToken = g.inviteToken;
  if (!inviteToken) {
    // grupos antigos: cria convite na primeira visita
    inviteToken = newToken();
    await db.group.update({ where: { id: g.id }, data: { inviteToken } });
  }
  return {
    name: g.name,
    drawn: g.drawnAt !== null,
    inviteToken,
    participants: g.participants,
    exclusions: g.exclusions.map((e) => ({
      id: e.id,
      giverId: e.giverId,
      giverName: e.giver.name,
      receiverId: e.receiverId,
      receiverName: e.receiver.name,
    })),
  };
}

export async function addParticipant(adminToken: string, rawName: string, rawPhone?: string) {
  const g = await requireOpenGroup(adminToken);
  const name = parse(personName, rawName);
  const phone = parsePhone(rawPhone);
  const existing = await db.participant.findMany({
    where: { groupId: g.id },
    select: { name: true },
  });
  if (existing.length >= LIMITS.maxPeople)
    throw new AppError(`Máximo de ${LIMITS.maxPeople} pessoas.`);
  assertUniqueNames([...existing.map((p) => p.name), name]);
  await db.participant.create({ data: { groupId: g.id, name, phone, token: newToken() } });
}

/** Telefone pode mudar a qualquer hora (não afeta o sorteio). */
export async function updateParticipantPhone(
  adminToken: string,
  participantId: string,
  rawPhone: string,
) {
  const g = await requireGroup(adminToken);
  const phone = parsePhone(rawPhone);
  const r = await db.participant.updateMany({
    where: { id: participantId, groupId: g.id },
    data: { phone },
  });
  if (r.count === 0) throw new AppError("Pessoa não encontrada.");
}

export async function removeParticipant(adminToken: string, participantId: string) {
  const g = await requireOpenGroup(adminToken);
  const r = await db.participant.deleteMany({ where: { id: participantId, groupId: g.id } });
  if (r.count === 0) throw new AppError("Pessoa não encontrada.");
}

export async function addExclusion(
  adminToken: string,
  giverId: string,
  receiverId: string,
  mutual: boolean,
) {
  const g = await requireOpenGroup(adminToken);
  if (giverId === receiverId) throw new AppError("Escolha duas pessoas diferentes.");
  const count = await db.participant.count({
    where: { groupId: g.id, id: { in: [giverId, receiverId] } },
  });
  if (count !== 2) throw new AppError("Pessoa não encontrada.");

  const pairs: [string, string][] = [[giverId, receiverId]];
  if (mutual) pairs.push([receiverId, giverId]);
  await db.exclusion.createMany({
    data: pairs.map(([gi, re]) => ({ groupId: g.id, giverId: gi, receiverId: re })),
    skipDuplicates: true,
  });
}

export async function removeExclusion(adminToken: string, exclusionId: string) {
  const g = await requireOpenGroup(adminToken);
  const r = await db.exclusion.deleteMany({ where: { id: exclusionId, groupId: g.id } });
  if (r.count === 0) throw new AppError("Regra não encontrada.");
}

export async function runDraw(adminToken: string) {
  const g = await requireGroup(adminToken);
  await db.$transaction(async (tx) => {
    // trava a linha do grupo para evitar dois sorteios ao mesmo tempo
    await tx.$queryRaw`SELECT id FROM "Group" WHERE id = ${g.id} FOR UPDATE`;
    const people = await tx.participant.findMany({
      where: { groupId: g.id },
      select: { id: true },
    });
    const excl = await tx.exclusion.findMany({
      where: { groupId: g.id },
      select: { giverId: true, receiverId: true },
    });

    let result: Map<string, string>;
    try {
      result = draw(
        people.map((p) => p.id),
        excl.map((e) => [e.giverId, e.receiverId] as const),
      );
    } catch (e) {
      if (e instanceof ImpossibleDrawError || e instanceof NotEnoughPeopleError)
        throw new AppError(e.message);
      throw e;
    }

    await tx.participant.updateMany({ where: { groupId: g.id }, data: { assignedToId: null } });
    for (const [giver, receiver] of result) {
      await tx.participant.update({ where: { id: giver }, data: { assignedToId: receiver } });
    }
    await tx.group.update({ where: { id: g.id }, data: { drawnAt: new Date() } });
  });
}

export async function resetDraw(adminToken: string) {
  const g = await requireGroup(adminToken);
  await db.$transaction([
    db.participant.updateMany({ where: { groupId: g.id }, data: { assignedToId: null } }),
    db.group.update({ where: { id: g.id }, data: { drawnAt: null } }),
  ]);
}

// ---------- convite ----------

export type InviteView = { groupName: string; drawn: boolean; count: number };

export async function getInviteView(inviteToken: string): Promise<InviteView | null> {
  if (!looksLikeToken(inviteToken)) return null;
  const g = await db.group.findUnique({
    where: { inviteToken },
    select: { name: true, drawnAt: true, _count: { select: { participants: true } } },
  });
  if (!g) return null;
  return { groupName: g.name, drawn: g.drawnAt !== null, count: g._count.participants };
}

const requiredWishlist = z
  .string()
  .trim()
  .min(1, "Conta o que você quer ganhar.")
  .max(LIMITS.wishlist, `Lista até ${LIMITS.wishlist} letras.`);

/** Jogador entra pelo link de convite. Nome e desejo obrigatórios; telefone opcional. */
export async function joinGroup(
  inviteToken: string,
  input: { name: string; phone?: string; wishlist: string },
): Promise<{ token: string }> {
  const name = parse(personName, input?.name);
  const phone = parsePhone(input?.phone);
  const wishlist = parse(requiredWishlist, input?.wishlist);
  if (!looksLikeToken(inviteToken)) throw new AppError("Esse convite não existe.");

  const token = newToken();
  await db.$transaction(async (tx) => {
    const g = await tx.group.findUnique({ where: { inviteToken }, select: { id: true } });
    if (!g) throw new AppError("Esse convite não existe.");
    // trava o grupo: evita entrar durante o sorteio e nomes repetidos ao mesmo tempo
    const [locked] = await tx.$queryRaw<{ drawnAt: Date | null }[]>`
      SELECT "drawnAt" FROM "Group" WHERE id = ${g.id} FOR UPDATE`;
    if (locked.drawnAt) throw new AppError("O sorteio já foi feito. Fala com o organizador.");

    const existing = await tx.participant.findMany({
      where: { groupId: g.id },
      select: { name: true, phone: true },
    });
    if (existing.length >= LIMITS.maxPeople)
      throw new AppError(`O grupo já tem ${LIMITS.maxPeople} pessoas.`);
    if (phone && existing.some((p) => p.phone === phone))
      throw new AppError("Esse telefone já entrou no grupo.");
    const key = name.toLocaleLowerCase("pt-BR");
    if (existing.some((p) => p.name.toLocaleLowerCase("pt-BR") === key))
      throw new AppError(`Já tem alguém chamado "${name}". Coloca o sobrenome.`);

    await tx.participant.create({ data: { groupId: g.id, name, phone, wishlist, token } });
  });
  return { token };
}

// ---------- participante ----------

export type ParticipantView = {
  name: string;
  groupName: string;
  wishlist: string;
  drawn: boolean;
  friend: { name: string; wishlist: string } | null;
};

export async function getParticipantView(token: string): Promise<ParticipantView | null> {
  if (!looksLikeToken(token)) return null;
  const p = await db.participant.findUnique({
    where: { token },
    select: {
      name: true,
      wishlist: true,
      group: { select: { name: true, drawnAt: true } },
      assignedTo: { select: { name: true, wishlist: true } },
    },
  });
  if (!p) return null;
  const drawn = p.group.drawnAt !== null;
  return {
    name: p.name,
    groupName: p.group.name,
    wishlist: p.wishlist,
    drawn,
    friend: drawn && p.assignedTo ? p.assignedTo : null,
  };
}

export async function updateWishlist(token: string, text: string) {
  const value = parse(
    z.string().max(LIMITS.wishlist, `Lista até ${LIMITS.wishlist} letras.`),
    text,
  );
  if (!looksLikeToken(token)) throw new AppError("Esse link não existe ou expirou.");
  const r = await db.participant.updateMany({ where: { token }, data: { wishlist: value } });
  if (r.count === 0) throw new AppError("Esse link não existe ou expirou.");
}
