"use client";

import { useEffect, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateWishlistAction } from "@/app/actions";
import { Button, ErrorText, inputClass } from "./ui";

const MAX = 2000;

export function WishlistForm({ token, initial }: { token: string; initial: string }) {
  const [text, setText] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(undefined);
        start(async () => {
          const r = await updateWishlistAction(token, text);
          if (r.ok) setSaved(true);
          else setError(r.error);
        });
      }}
    >
      <label htmlFor="wishlist" className="mb-2 block text-[15px] font-semibold">
        Sua lista de desejos
      </label>
      <textarea
        id="wishlist"
        className={`${inputClass} min-h-32 resize-y`}
        value={text}
        maxLength={MAX}
        onChange={(e) => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder={
          "Ex: livro de receitas, meia divertida, chocolate amargo…\nTamanho de roupa: M"
        }
        aria-describedby="wishlist-count"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <span id="wishlist-count" className="text-[13px] tabular-nums text-muted">
          {text.length}/{MAX}
        </span>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="text-[13px] font-semibold text-secondary">
            {saved && (
              <span className="inline-flex items-center gap-1">
                <Check className="size-4" aria-hidden /> Salvo
              </span>
            )}
          </span>
          <Button type="submit" variant="secondary" loading={pending} disabled={text === initial}>
            Salvar
          </Button>
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
    </form>
  );
}
