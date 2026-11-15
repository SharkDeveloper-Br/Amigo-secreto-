"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import * as groups from "@/lib/groups";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function run(fn: () => Promise<unknown>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof groups.AppError) return { ok: false, error: e.message };
    console.error(e);
    return { ok: false, error: "Algo deu errado. Tenta de novo." };
  }
}

const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function createGroupAction(
  name: string,
  participants: { name: string; phone: string }[],
): Promise<ActionResult> {
  let adminToken = "";
  const r = await run(async () => {
    ({ adminToken } = await groups.createGroup({
      name: str(name),
      participants: Array.isArray(participants)
        ? participants.map((p) => ({ name: str(p?.name), phone: str(p?.phone) }))
        : [],
    }));
  });
  if (!r.ok) return r;
  redirect(`/g/${adminToken}`);
}

export async function addParticipantAction(adminToken: string, name: string, phone: string) {
  const r = await run(() => groups.addParticipant(str(adminToken), str(name), str(phone)));
  if (r.ok) refresh();
  return r;
}

export async function updatePhoneAction(adminToken: string, participantId: string, phone: string) {
  const r = await run(() =>
    groups.updateParticipantPhone(str(adminToken), str(participantId), str(phone)),
  );
  if (r.ok) refresh();
  return r;
}

export async function removeParticipantAction(adminToken: string, participantId: string) {
  const r = await run(() => groups.removeParticipant(str(adminToken), str(participantId)));
  if (r.ok) refresh();
  return r;
}

export async function addExclusionAction(
  adminToken: string,
  giverId: string,
  receiverId: string,
  mutual: boolean,
) {
  const r = await run(() =>
    groups.addExclusion(str(adminToken), str(giverId), str(receiverId), mutual === true),
  );
  if (r.ok) refresh();
  return r;
}

export async function removeExclusionAction(adminToken: string, exclusionId: string) {
  const r = await run(() => groups.removeExclusion(str(adminToken), str(exclusionId)));
  if (r.ok) refresh();
  return r;
}

export async function drawAction(adminToken: string) {
  const r = await run(() => groups.runDraw(str(adminToken)));
  if (r.ok) refresh();
  return r;
}

export async function resetDrawAction(adminToken: string) {
  const r = await run(() => groups.resetDraw(str(adminToken)));
  if (r.ok) refresh();
  return r;
}

export async function updateWishlistAction(token: string, text: string) {
  const r = await run(() => groups.updateWishlist(str(token), str(text)));
  if (r.ok) refresh();
  return r;
}
