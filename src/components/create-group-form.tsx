"use client";

import { useState, useTransition, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { createGroupAction } from "@/app/actions";
import { Button, Card, ErrorText, inputClass } from "./ui";

export function CreateGroupForm() {
  const [name, setName] = useState("");
  const [person, setPerson] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function add() {
    const n = person.trim();
    if (!n) return;
    if (people.some((p) => p.toLocaleLowerCase("pt-BR") === n.toLocaleLowerCase("pt-BR"))) {
      setError(`"${n}" já está na lista.`);
      return;
    }
    setPeople([...people, n]);
    setPerson("");
    setError(undefined);
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
      const r = await createGroupAction(name, people);
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

        <div>
          <label htmlFor="person" className="mb-2 block text-[15px] font-semibold">
            Quem vai participar?
          </label>
          <div className="flex gap-2">
            <input
              id="person"
              className={inputClass}
              placeholder="Nome e Enter"
              value={person}
              maxLength={40}
              onChange={(e) => setPerson(e.target.value)}
              onKeyDown={onKey}
              autoComplete="off"
              aria-describedby="person-hint"
            />
            <Button type="button" variant="secondary" onClick={add} aria-label="Adicionar pessoa">
              <Plus className="size-5" aria-hidden />
            </Button>
          </div>
          <p id="person-hint" className="mt-2 text-[13px] text-muted">
            {missing > 0
              ? `Faltam ${missing} ${missing === 1 ? "pessoa" : "pessoas"} (mínimo 3).`
              : `${people.length} pessoas na lista.`}
          </p>

          {people.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Participantes">
              {people.map((p) => (
                <li
                  key={p}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-bg py-1 pl-3 pr-1 text-[15px]"
                >
                  {p}
                  <button
                    type="button"
                    onClick={() => setPeople(people.filter((x) => x !== p))}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-border/60 hover:text-text"
                    aria-label={`Remover ${p}`}
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ErrorText>{error}</ErrorText>

        <Button type="submit" loading={pending} disabled={missing > 0 || !name.trim()}>
          Criar grupo
        </Button>
      </form>
    </Card>
  );
}
