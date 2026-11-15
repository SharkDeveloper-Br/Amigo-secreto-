import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import {
  addExclusion,
  addParticipant,
  AppError,
  createGroup,
  getAdminView,
  getInviteView,
  getParticipantView,
  joinGroup,
  removeExclusion,
  removeParticipant,
  resetDraw,
  runDraw,
  updateParticipantPhone,
  updateWishlist,
} from "./groups";

beforeEach(async () => {
  await db.$executeRawUnsafe('TRUNCATE "Exclusion", "Participant", "Group" CASCADE');
});
afterAll(async () => {
  await db.$disconnect();
});

const nomes = ["Ana", "Bruno", "Carla", "Davi"];

async function novoGrupo(names = nomes) {
  const { adminToken } = await createGroup({ name: "Família", participants: names });
  const view = (await getAdminView(adminToken))!;
  const byName = Object.fromEntries(view.participants.map((p) => [p.name, p]));
  return { adminToken, view, byName };
}

describe("createGroup", () => {
  it("cria grupo com participantes e tokens", async () => {
    const { view } = await novoGrupo();
    expect(view.name).toBe("Família");
    expect(view.drawn).toBe(false);
    expect(view.participants.map((p) => p.name).sort()).toEqual([...nomes].sort());
    for (const p of view.participants) expect(p.token).toHaveLength(32);
  });

  it("limpa espaços e recusa nomes repetidos", async () => {
    await expect(
      createGroup({ name: "X", participants: ["Ana", " ana ", "Bruno", "Carla"] }),
    ).rejects.toThrow(AppError);
  });

  it("pode criar sem ninguém (convite depois)", async () => {
    const { adminToken } = await createGroup({ name: "X", participants: [] });
    const v = (await getAdminView(adminToken))!;
    expect(v.participants).toHaveLength(0);
    await expect(runDraw(adminToken)).rejects.toThrow(/3 pessoas/);
  });

  it("recusa nome de grupo vazio", async () => {
    await expect(createGroup({ name: "  ", participants: nomes })).rejects.toThrow(AppError);
  });
});

describe("admin", () => {
  it("token errado → null", async () => {
    expect(await getAdminView("x".repeat(32))).toBeNull();
    expect(await getAdminView("lixo")).toBeNull();
  });

  it("adiciona e remove participante antes do sorteio", async () => {
    const { adminToken, byName } = await novoGrupo();
    await addParticipant(adminToken, "Eva");
    await removeParticipant(adminToken, byName.Ana.id);
    const v = (await getAdminView(adminToken))!;
    expect(v.participants.map((p) => p.name).sort()).toEqual(["Bruno", "Carla", "Davi", "Eva"]);
  });

  it("não remove participante de outro grupo", async () => {
    const a = await novoGrupo();
    const b = await novoGrupo(["X", "Y", "Z"]);
    await expect(removeParticipant(a.adminToken, b.byName.X.id)).rejects.toThrow(AppError);
  });

  it("exclusão com vice-versa", async () => {
    const { adminToken, byName } = await novoGrupo();
    await addExclusion(adminToken, byName.Ana.id, byName.Bruno.id, true);
    const v = (await getAdminView(adminToken))!;
    expect(v.exclusions).toHaveLength(2);
    await removeExclusion(adminToken, v.exclusions[0].id);
    expect((await getAdminView(adminToken))!.exclusions).toHaveLength(1);
  });

  it("exclusão repetida não duplica; consigo mesmo é erro", async () => {
    const { adminToken, byName } = await novoGrupo();
    await addExclusion(adminToken, byName.Ana.id, byName.Bruno.id, false);
    await addExclusion(adminToken, byName.Ana.id, byName.Bruno.id, true);
    expect((await getAdminView(adminToken))!.exclusions).toHaveLength(2);
    await expect(addExclusion(adminToken, byName.Ana.id, byName.Ana.id, false)).rejects.toThrow(
      AppError,
    );
  });

  it("admin view não mostra quem tirou quem", async () => {
    const { adminToken } = await novoGrupo();
    await runDraw(adminToken);
    const v = (await getAdminView(adminToken))!;
    expect(v.drawn).toBe(true);
    expect(JSON.stringify(v)).not.toContain("assigned");
  });
});

describe("sorteio", () => {
  it("sorteia respeitando exclusões e trava edição", async () => {
    const { adminToken, byName } = await novoGrupo();
    await addExclusion(adminToken, byName.Ana.id, byName.Bruno.id, true);
    await runDraw(adminToken);

    const ana = (await getParticipantView(byName.Ana.token))!;
    expect(ana.drawn).toBe(true);
    expect(ana.friend).not.toBeNull();
    expect(["Carla", "Davi"]).toContain(ana.friend!.name);

    await expect(addParticipant(adminToken, "Eva")).rejects.toThrow(AppError);
    await expect(addExclusion(adminToken, byName.Carla.id, byName.Davi.id, false)).rejects.toThrow(
      AppError,
    );
  });

  it("todos recebem exatamente uma vez", async () => {
    const { adminToken, byName } = await novoGrupo();
    await runDraw(adminToken);
    const friends = await Promise.all(
      nomes.map(async (n) => (await getParticipantView(byName[n].token))!.friend!.name),
    );
    expect(friends.sort()).toEqual([...nomes].sort());
    for (const n of nomes) {
      expect((await getParticipantView(byName[n].token))!.friend!.name).not.toBe(n);
    }
  });

  it("sorteio impossível dá erro claro e não muda nada", async () => {
    const { adminToken, byName } = await novoGrupo(["Ana", "Bruno", "Carla"]);
    await addExclusion(adminToken, byName.Ana.id, byName.Bruno.id, false);
    await addExclusion(adminToken, byName.Ana.id, byName.Carla.id, false);
    await expect(runDraw(adminToken)).rejects.toThrow(/não dá pra sortear/);
    expect((await getAdminView(adminToken))!.drawn).toBe(false);
  });

  it("resetDraw libera edição e apaga resultado", async () => {
    const { adminToken, byName } = await novoGrupo();
    await runDraw(adminToken);
    await resetDraw(adminToken);
    expect((await getParticipantView(byName.Ana.token))!.friend).toBeNull();
    await addParticipant(adminToken, "Eva");
  });
});

describe("participante", () => {
  it("antes do sorteio: sem amigo", async () => {
    const { byName } = await novoGrupo();
    const v = (await getParticipantView(byName.Ana.token))!;
    expect(v).toMatchObject({ name: "Ana", groupName: "Família", drawn: false, friend: null });
  });

  it("vê lista de desejos do amigo e só dele", async () => {
    const { adminToken, byName } = await novoGrupo();
    for (const n of nomes) await updateWishlist(byName[n].token, `quero presente da ${n}`);
    await runDraw(adminToken);
    const v = (await getParticipantView(byName.Ana.token))!;
    expect(v.wishlist).toBe("quero presente da Ana");
    expect(v.friend!.wishlist).toBe(`quero presente da ${v.friend!.name}`);
    const json = JSON.stringify(v);
    expect(json).not.toContain("token");
    expect(json).not.toContain(adminToken);
  });

  it("lista de desejos tem limite", async () => {
    const { byName } = await novoGrupo();
    await expect(updateWishlist(byName.Ana.token, "x".repeat(2001))).rejects.toThrow(AppError);
  });

  it("token inválido → null / erro", async () => {
    expect(await getParticipantView("y".repeat(32))).toBeNull();
    await expect(updateWishlist("y".repeat(32), "oi")).rejects.toThrow(AppError);
  });
});

describe("telefone", () => {
  it("salva telefone normalizado ao criar", async () => {
    const { adminToken } = await createGroup({
      name: "Fone",
      participants: [
        { name: "Ana", phone: "(11) 98765-4321" },
        { name: "Bruno", phone: "" },
        "Carla",
      ],
    });
    const v = (await getAdminView(adminToken))!;
    const phones = Object.fromEntries(v.participants.map((p) => [p.name, p.phone]));
    expect(phones).toEqual({ Ana: "5511987654321", Bruno: null, Carla: null });
  });

  it("telefone inválido → erro", async () => {
    await expect(
      createGroup({ name: "X", participants: [{ name: "Ana", phone: "123" }, "Bruno", "Carla"] }),
    ).rejects.toThrow(AppError);
  });

  it("adiciona pessoa com telefone", async () => {
    const { adminToken } = await novoGrupo();
    await addParticipant(adminToken, "Eva", "21 99999-8888");
    const v = (await getAdminView(adminToken))!;
    expect(v.participants.find((p) => p.name === "Eva")!.phone).toBe("5521999998888");
  });

  it("muda telefone mesmo depois do sorteio e pode apagar", async () => {
    const { adminToken, byName } = await novoGrupo();
    await runDraw(adminToken);
    await updateParticipantPhone(adminToken, byName.Ana.id, "11 98765-4321");
    let v = (await getAdminView(adminToken))!;
    expect(v.participants.find((p) => p.name === "Ana")!.phone).toBe("5511987654321");
    await updateParticipantPhone(adminToken, byName.Ana.id, "");
    v = (await getAdminView(adminToken))!;
    expect(v.participants.find((p) => p.name === "Ana")!.phone).toBeNull();
  });

  it("não muda telefone de outro grupo", async () => {
    const a = await novoGrupo();
    const b = await novoGrupo(["X", "Y", "Z"]);
    await expect(
      updateParticipantPhone(a.adminToken, b.byName.X.id, "11 98765-4321"),
    ).rejects.toThrow(AppError);
  });

  it("participante não vê telefones", async () => {
    const { adminToken } = await createGroup({
      name: "Fone",
      participants: [
        { name: "Ana", phone: "11 98765-4321" },
        { name: "Bruno", phone: "11 91111-2222" },
        { name: "Carla", phone: "11 93333-4444" },
      ],
    });
    await runDraw(adminToken);
    const v = (await getAdminView(adminToken))!;
    for (const p of v.participants) {
      const json = JSON.stringify(await getParticipantView(p.token));
      expect(json).not.toMatch(/9876|1111|3333|phone/);
    }
  });
});

describe("convite", () => {
  const dados = { name: "Fábio", phone: "(11) 98765-4321", wishlist: "Um livro" };

  it("admin tem link de convite", async () => {
    const { view } = await novoGrupo();
    expect(view.inviteToken).toHaveLength(32);
  });

  it("convite mostra nome do grupo e quantos entraram", async () => {
    const { view } = await novoGrupo();
    expect(await getInviteView(view.inviteToken)).toEqual({
      groupName: "Família",
      drawn: false,
      count: 4,
    });
    expect(await getInviteView("q".repeat(32))).toBeNull();
  });

  it("jogador entra com nome, telefone e desejo", async () => {
    const { adminToken, view } = await novoGrupo();
    const { token } = await joinGroup(view.inviteToken, dados);
    const me = (await getParticipantView(token))!;
    expect(me).toMatchObject({ name: "Fábio", wishlist: "Um livro", groupName: "Família" });
    const admin = (await getAdminView(adminToken))!;
    expect(admin.participants.find((p) => p.name === "Fábio")!.phone).toBe("5511987654321");
  });

  it("tudo é obrigatório", async () => {
    const { view } = await novoGrupo();
    for (const faltando of [
      { ...dados, name: " " },
      { ...dados, phone: "" },
      { ...dados, wishlist: "  " },
      { ...dados, phone: "123" },
    ]) {
      await expect(joinGroup(view.inviteToken, faltando)).rejects.toThrow(AppError);
    }
    expect((await getInviteView(view.inviteToken))!.count).toBe(4);
  });

  it("não entra com nome ou telefone repetido", async () => {
    const { view } = await novoGrupo();
    await joinGroup(view.inviteToken, dados);
    await expect(joinGroup(view.inviteToken, { ...dados, phone: "11 90000-0000" })).rejects.toThrow(
      /já tem alguém/i,
    );
    await expect(
      joinGroup(view.inviteToken, { ...dados, name: "Outro", phone: "11987654321" }),
    ).rejects.toThrow(/telefone/i);
  });

  it("depois do sorteio não entra mais", async () => {
    const { adminToken, view } = await novoGrupo();
    await runDraw(adminToken);
    expect((await getInviteView(view.inviteToken))!.drawn).toBe(true);
    await expect(joinGroup(view.inviteToken, dados)).rejects.toThrow(/sorteio/i);
  });

  it("convite errado", async () => {
    await expect(joinGroup("q".repeat(32), dados)).rejects.toThrow(AppError);
  });
});
