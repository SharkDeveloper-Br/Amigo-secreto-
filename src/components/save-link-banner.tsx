"use client";

import { useState } from "react";
import { Bookmark, Check, Copy } from "lucide-react";
import { Button } from "./ui";

/** Aviso depois de entrar: guarde seu link pessoal. */
export function SaveLinkBanner() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.origin + window.location.pathname;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt("Copie seu link:", url);
    }
  }

  return (
    <div className="rounded-2xl border border-secondary/50 bg-surface p-4 sm:p-6">
      <p className="flex items-center gap-2 font-semibold text-secondary">
        <Check className="size-5" aria-hidden /> Pronto, você entrou!
      </p>
      <p className="mt-2 flex items-start gap-2 text-[15px] text-muted">
        <Bookmark className="mt-0.5 size-4 shrink-0" aria-hidden />
        Guarde o link desta página: é por ele que você vai ver quem tirou depois do sorteio. O
        organizador também pode te mandar de novo.
      </p>
      <Button variant="secondary" className="mt-3" onClick={copy}>
        {copied ? (
          <Check className="size-4" aria-hidden />
        ) : (
          <Copy className="size-4" aria-hidden />
        )}
        {copied ? "Link copiado!" : "Copiar meu link"}
      </Button>
    </div>
  );
}
