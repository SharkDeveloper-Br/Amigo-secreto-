"use client";

import { useState, useTransition } from "react";
import { joinGroupAction } from "@/app/actions";
import { normalizePhone } from "@/lib/phone";
import { Button, ErrorText, inputClass } from "./ui";

const MAX = 2000;

export function JoinForm({ inviteToken }: { inviteToken: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wishlist, setWishlist] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string; wishlist?: string }>({});
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  function validate() {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Coloca seu nome.";
    try {
      normalizePhone(phone);
    } catch (err) {
      e.phone = (err as Error).message;
    }
    if (!wishlist.trim()) e.wishlist = "Conta o que você quer ganhar.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        if (!validate()) return;
        start(async () => {
          const r = await joinGroupAction(inviteToken, { name, phone, wishlist });
          if (r && !r.ok) setError(r.error);
        });
      }}
    >
      <div>
        <label htmlFor="join-name" className="mb-2 block text-[15px] font-semibold">
          Seu nome
        </label>
        <input
          id="join-name"
          className={inputClass}
          value={name}
          maxLength={40}
          required
          autoComplete="name"
          placeholder="Ex: Ana Souza"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "join-name-err" : undefined}
          onChange={(e) => setName(e.target.value)}
        />
        <ErrorText id="join-name-err">{errors.name}</ErrorText>
      </div>

      <div>
        <label htmlFor="join-phone" className="mb-2 block text-[15px] font-semibold">
          Seu WhatsApp <span className="font-normal text-muted">(opcional)</span>
        </label>
        <input
          id="join-phone"
          type="tel"
          inputMode="tel"
          className={inputClass}
          value={phone}
          maxLength={25}
          autoComplete="tel"
          placeholder="(11) 98765-4321"
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "join-phone-err" : "join-phone-hint"}
          onChange={(e) => setPhone(e.target.value)}
        />
        {errors.phone ? (
          <ErrorText id="join-phone-err">{errors.phone}</ErrorText>
        ) : (
          <p id="join-phone-hint" className="mt-2 text-[13px] text-muted">
            Só o organizador vê. Serve pra ele te mandar o link de novo se você perder.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="join-wish" className="mb-2 block text-[15px] font-semibold">
          O que você quer ganhar?
        </label>
        <textarea
          id="join-wish"
          className={`${inputClass} min-h-32 resize-y`}
          value={wishlist}
          maxLength={MAX}
          required
          placeholder={
            "Ex: livro de receitas, meia divertida, chocolate amargo…\nTamanho de roupa: M"
          }
          aria-invalid={!!errors.wishlist}
          aria-describedby={errors.wishlist ? "join-wish-err" : "join-wish-count"}
          onChange={(e) => setWishlist(e.target.value)}
        />
        <div className="flex justify-between gap-2">
          <ErrorText id="join-wish-err">{errors.wishlist}</ErrorText>
          <span id="join-wish-count" className="mt-2 ml-auto text-[13px] tabular-nums text-muted">
            {wishlist.length}/{MAX}
          </span>
        </div>
      </div>

      <ErrorText>{error}</ErrorText>

      <Button type="submit" loading={pending}>
        Entrar no amigo secreto
      </Button>
    </form>
  );
}
