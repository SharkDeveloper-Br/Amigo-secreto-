"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Phone, Plus, X } from "lucide-react";
import { createGroupAction } from "@/app/actions";
import { formatPhone, normalizePhone } from "@/lib/phone";
import { Button, Card, ErrorText, inputClass } from "./ui";

type Person = { name: string; phone: string | null };

export function CreateGroupForm() {
  const [name, setName] = useState("");
  const [person, setPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const nameRef = useRef<HTMLInputElement>(null);

  function add() {
    const n = person.trim();
    if (!n) {
      nameRef.current?.focus();
      return;
    }
    if (people.some((p) => p.name.toLocaleLowerCase("pt-BR") === n.toLocaleLowerCase("pt-BR"))) {
      setError(`"${n}" já está na lista.`);
      return;
    }
    let normalized: string | null;
    try {
      normalized = normalizePhone(phone);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    setPeople([...people, { name: n, phone: normalized }]);
    setPerson("");
    setPhone("");
    setError(undefined);
    nameRef.current?.focus();
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  function submit() {
    setError(undefined);
    start(async () => {
      const r = await createGroupAction(
        name,
        people.map((p) => ({ name: p.name, phone: p.phone ?? "" })),
      );
      if (r && !r.ok) setError(r.error);
    });
  }

  const missing = Math.max(0, 3 - people.length);

  return (
    <Card>
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div>
          <label htmlFor="group-name" className="mb-2 block text-[15px] font-semibold">
            Nome do grupo
          </label>
          <input
            id="group-name"
            className={inputClass}
            placeholder="Ex: Família Silva 2026"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </div>

        <fieldset>
          <legend className="mb-2 block text-[15px] font-semibold">Quem vai participar?</legend>
          <div className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="person" className="sr-only">
                Nome
              </label>
              <input
                ref={nameRef}
                id="person"
                className={inputClass}
                placeholder="Nome"
                value={person}
                maxLength={40}
                onChange={(e) => setPerson(e.target.value)}
                onKeyDown={onKey}
                autoComplete="off"
                aria-describedby="person-hint"
              />
            </div>
            <div>
              <label htmlFor="phone" className="sr-only">
                Telefone (WhatsApp)
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                className={inputClass}
                placeholder="WhatsApp (11) 98765-4321"
                value={phone}
                maxLength={25}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={onKey}
                autoComplete="off"
                aria-describedby="person-hint"
              />
            </div>
            <Button type="button" variant="secondary" onClick={add} aria-label="Adicionar pessoa">
              <Plus className="size-5" aria-hidden />
            </Button>
          </div>
          <p id="person-hint" className="mt-2 text-[13px] text-muted">
            Telefone é opcional: serve pra mandar o link direto no WhatsApp.{" "}
            {missing > 0
              ? `Faltam ${missing} ${missing === 1 ? "pessoa" : "pessoas"} (mínimo 3).`
              : `${people.length} pessoas na lista.`}
          </p>

          {people.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Participantes">
              {people.map((p) => (
                <li
                  key={p.name}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-bg py-1 pl-3 pr-1 text-[15px]"
                >
                  <span>{p.name}</span>
                  {p.phone && (
                    <span className="inline-flex items-center gap-1 text-[13px] tabular-nums text-muted">
                      <Phone className="size-3" aria-hidden />
                      {formatPhone(p.phone)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setPeople(people.filter((x) => x !== p))}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-border/60 hover:text-text"
                    aria-label={`Remover ${p.name}`}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <ErrorText>{error}</ErrorText>

        <Button type="submit" loading={pending} disabled={missing > 0 || !name.trim()}>
          Criar grupo
        </Button>
      </form>
    </Card>
  );
}
