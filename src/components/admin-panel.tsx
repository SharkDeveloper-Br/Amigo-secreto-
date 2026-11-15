"use client";

import { useEffect, useState, useSyncExternalStore, useTransition } from "react";
import {
  Ban,
  Check,
  Copy,
  Lock,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Shuffle,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  addExclusionAction,
  addParticipantAction,
  drawAction,
  removeExclusionAction,
  removeParticipantAction,
  resetDrawAction,
  updatePhoneAction,
  type ActionResult,
} from "@/app/actions";
import type { AdminView } from "@/lib/groups";
import { formatPhone } from "@/lib/phone";
import { Button, Card, ErrorText, SectionTitle, inputClass } from "./ui";

function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  const exec = (fn: () => Promise<ActionResult>, onOk?: () => void) => {
    setError(undefined);
    start(async () => {
      const r = await fn();
      if (r.ok) onOk?.();
      else setError(r.error);
    });
  };
  return { pending, error, exec };
}

function Toast({ message }: { message?: string }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      {message && (
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-[15px] font-semibold text-on-secondary shadow-card">
          <Check className="size-4" aria-hidden />
          {message}
        </div>
      )}
    </div>
  );
}

const noopSubscribe = () => () => {};

export function AdminPanel({ adminToken, view }: { adminToken: string; view: AdminView }) {
  const [toast, setToast] = useState<string>();
  const origin = useSyncExternalStore(
    noopSubscribe,
    () => window.location.origin,
    () => "",
  );
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const linkFor = (token: string) => `${origin}/p/${token}`;

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast("Link copiado!");
    } catch {
      window.prompt("Copie o link:", text);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gold-text">
          Painel do organizador
        </p>
        <h1 className="mt-1 font-display text-[28px] font-semibold leading-[1.15] sm:text-[32px]">
          {view.name}
        </h1>
        <p className="mt-3 flex items-start gap-2 rounded-[10px] border border-dashed border-gold bg-surface p-3 text-[13px] text-muted">
          <Lock className="mt-0.5 size-4 shrink-0 text-gold-text" aria-hidden />
          Guarde o link desta página: é o único jeito de voltar aqui. Você não vê quem tirou quem.
        </p>
      </div>

      <DrawCard adminToken={adminToken} view={view} />

      <Card>
        <SectionTitle>Participantes ({view.participants.length})</SectionTitle>
        <p className="mt-1 text-[13px] text-muted">
          {view.drawn
            ? "Mande o link de cada um. Ele mostra quem a pessoa tirou."
            : "Já dá pra mandar os links: cada um escreve sua lista de desejos."}
        </p>
        <ul className="mt-4 flex flex-col gap-3">
          {view.participants.map((p) => (
            <GiftTag
              key={p.id}
              name={p.name}
              phone={p.phone}
              link={linkFor(p.token)}
              canRemove={!view.drawn}
              onCopy={copy}
              adminToken={adminToken}
              participantId={p.id}
              groupName={view.name}
            />
          ))}
        </ul>
        {!view.drawn && <AddParticipant adminToken={adminToken} />}
      </Card>

      <Exclusions adminToken={adminToken} view={view} />

      <Toast message={toast} />
    </div>
  );
}

function DrawCard({ adminToken, view }: { adminToken: string; view: AdminView }) {
  const draw = useAction();
  const reset = useAction();
  const enough = view.participants.length >= 3;

  if (view.drawn) {
    return (
      <Card className="border-secondary/40">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
            <Check className="size-5" aria-hidden />
          </span>
          <div className="flex-1">
            <SectionTitle>Sorteio feito!</SectionTitle>
            <p className="mt-1 text-muted">Agora é só mandar os links abaixo.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="ghost"
            loading={draw.pending}
            onClick={() => {
              if (confirm("Sortear de novo? Quem já viu vai ter um amigo diferente."))
                draw.exec(() => drawAction(adminToken));
            }}
          >
            <Shuffle className="size-4" aria-hidden /> Sortear de novo
          </Button>
          <Button
            variant="ghost"
            loading={reset.pending}
            onClick={() => {
              if (confirm("Desfazer o sorteio? Você poderá editar pessoas e regras."))
                reset.exec(() => resetDrawAction(adminToken));
            }}
          >
            <Undo2 className="size-4" aria-hidden /> Desfazer sorteio
          </Button>
        </div>
        <ErrorText>{draw.error ?? reset.error}</ErrorText>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle>Tudo pronto?</SectionTitle>
      <p className="mt-1 text-muted">
        Depois do sorteio, a lista de pessoas e as regras ficam travadas.
      </p>
      <Button
        className="mt-4 w-full sm:w-auto"
        loading={draw.pending}
        disabled={!enough}
        onClick={() => draw.exec(() => drawAction(adminToken))}
      >
        <Shuffle className="size-4" aria-hidden /> Sortear agora
      </Button>
      {!enough && <p className="mt-2 text-[13px] text-muted">Precisa de pelo menos 3 pessoas.</p>}
      <ErrorText>{draw.error}</ErrorText>
    </Card>
  );
}

function GiftTag({
  name,
  phone,
  link,
  canRemove,
  onCopy,
  adminToken,
  participantId,
  groupName,
}: {
  name: string;
  phone: string | null;
  link: string;
  canRemove: boolean;
  onCopy: (t: string) => void;
  adminToken: string;
  participantId: string;
  groupName: string;
}) {
  const remove = useAction();
  const save = useAction();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(phone ? formatPhone(phone) : "");
  const message = `Oi, ${name}! Seu link do amigo secreto "${groupName}" 🎁 (não mostra pra ninguém): ${link}`;
  const waHref = `https://wa.me/${phone ?? ""}?text=${encodeURIComponent(message)}`;
  const inputId = `phone-${participantId}`;

  return (
    <li className="relative rounded-xl border border-border bg-bg p-3 pl-10">
      {/* furinho + fita da etiqueta */}
      <span
        aria-hidden
        className="absolute left-3 top-6 size-3 rounded-full border-2 border-gold bg-surface"
      />
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{name}</p>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex min-h-8 items-center gap-1 text-[13px] tabular-nums text-muted hover:text-text"
              aria-label={phone ? `Editar telefone de ${name}` : `Adicionar telefone de ${name}`}
            >
              <Phone className="size-3" aria-hidden />
              {phone ? formatPhone(phone) : "Adicionar telefone"}
              <Pencil className="size-3" aria-hidden />
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          className="px-3"
          onClick={() => onCopy(link)}
          aria-label={`Copiar link de ${name}`}
        >
          <Copy className="size-4" aria-hidden /> <span className="hidden sm:inline">Copiar</span>
        </Button>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-[10px] px-3 text-[15px] font-semibold text-secondary hover:bg-border/50"
          aria-label={
            phone
              ? `Enviar link pro WhatsApp de ${name}`
              : `Enviar link de ${name} no WhatsApp (escolher contato)`
          }
        >
          <MessageCircle className="size-4" aria-hidden />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>
        {canRemove && (
          <Button
            variant="ghost"
            className="px-3 text-muted"
            loading={remove.pending}
            onClick={() => remove.exec(() => removeParticipantAction(adminToken, participantId))}
            aria-label={`Remover ${name}`}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        )}
      </div>

      {editing && (
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.exec(
              () => updatePhoneAction(adminToken, participantId, draft),
              () => setEditing(false),
            );
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Telefone de {name}
          </label>
          <input
            id={inputId}
            type="tel"
            inputMode="tel"
            className={inputClass}
            value={draft}
            maxLength={25}
            placeholder="(11) 98765-4321"
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <Button type="submit" variant="secondary" loading={save.pending}>
            Salvar
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="px-3"
            onClick={() => {
              setEditing(false);
              setDraft(phone ? formatPhone(phone) : "");
            }}
            aria-label="Cancelar"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </form>
      )}
      <ErrorText>{remove.error ?? save.error}</ErrorText>
    </li>
  );
}

function AddParticipant({ adminToken }: { adminToken: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const a = useAction();
  return (
    <form
      className="mt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        a.exec(
          () => addParticipantAction(adminToken, name, phone),
          () => {
            setName("");
            setPhone("");
          },
        );
      }}
    >
      <p className="mb-2 block text-[15px] font-semibold">Adicionar pessoa</p>
      <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="new-person" className="sr-only">
            Nome
          </label>
          <input
            id="new-person"
            className={inputClass}
            value={name}
            maxLength={40}
            placeholder="Nome"
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor="new-phone" className="sr-only">
            Telefone (WhatsApp)
          </label>
          <input
            id="new-phone"
            type="tel"
            inputMode="tel"
            className={inputClass}
            value={phone}
            maxLength={25}
            placeholder="WhatsApp (opcional)"
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="off"
          />
        </div>
        <Button type="submit" variant="secondary" loading={a.pending} aria-label="Adicionar">
          <Plus className="size-5" aria-hidden />
        </Button>
      </div>
      <ErrorText>{a.error}</ErrorText>
    </form>
  );
}

function Exclusions({ adminToken, view }: { adminToken: string; view: AdminView }) {
  const [giver, setGiver] = useState("");
  const [receiver, setReceiver] = useState("");
  const [mutual, setMutual] = useState(true);
  const add = useAction();
  const remove = useAction();

  return (
    <Card>
      <SectionTitle>Regras</SectionTitle>
      <p className="mt-1 text-[13px] text-muted">
        Ex: casal não tira um ao outro. Ninguém tira a si mesmo, isso já é automático.
      </p>

      {view.exclusions.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {view.exclusions.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-2 rounded-[10px] border border-border bg-bg px-3 py-1"
            >
              <Ban className="size-4 shrink-0 text-danger" aria-hidden />
              <span className="flex-1 text-[15px]">
                <strong>{e.giverName}</strong> não tira <strong>{e.receiverName}</strong>
              </span>
              {!view.drawn && (
                <Button
                  variant="ghost"
                  className="px-3 text-muted"
                  loading={remove.pending}
                  onClick={() => remove.exec(() => removeExclusionAction(adminToken, e.id))}
                  aria-label={`Remover regra ${e.giverName} não tira ${e.receiverName}`}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[15px] text-muted">Nenhuma regra ainda.</p>
      )}
      <ErrorText>{remove.error}</ErrorText>

      {!view.drawn && (
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            add.exec(
              () => addExclusionAction(adminToken, giver, receiver, mutual),
              () => {
                setGiver("");
                setReceiver("");
              },
            );
          }}
        >
          <div className="grid items-end gap-2 sm:grid-cols-[1fr_auto_1fr]">
            <div>
              <label htmlFor="ex-giver" className="mb-2 block text-[13px] font-semibold">
                Quem
              </label>
              <select
                id="ex-giver"
                className={inputClass}
                value={giver}
                onChange={(e) => setGiver(e.target.value)}
                required
              >
                <option value="">Escolha…</option>
                {view.participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="pb-3 text-center text-[13px] text-muted">não tira</span>
            <div>
              <label htmlFor="ex-receiver" className="mb-2 block text-[13px] font-semibold">
                Quem
              </label>
              <select
                id="ex-receiver"
                className={inputClass}
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                required
              >
                <option value="">Escolha…</option>
                {view.participants
                  .filter((p) => p.id !== giver)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 text-[15px]">
            <input
              type="checkbox"
              checked={mutual}
              onChange={(e) => setMutual(e.target.checked)}
              className="size-5 accent-[var(--secondary)]"
            />
            E vice-versa
          </label>
          <Button type="submit" variant="secondary" loading={add.pending} className="sm:self-start">
            <Plus className="size-4" aria-hidden /> Adicionar regra
          </Button>
          <ErrorText>{add.error}</ErrorText>
        </form>
      )}
    </Card>
  );
}
