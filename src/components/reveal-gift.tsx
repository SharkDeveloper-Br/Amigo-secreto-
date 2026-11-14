"use client";

import { useState, type ReactNode } from "react";
import { Button, Card } from "./ui";

const confettiColors = ["var(--primary)", "var(--gold)", "var(--secondary)"];
const pieces = Array.from({ length: 18 }, (_, i) => {
  const angle = (i / 18) * Math.PI * 2;
  const dist = 90 + (i % 3) * 30;
  return {
    dx: `${Math.round(Math.cos(angle) * dist)}px`,
    dy: `${Math.round(Math.sin(angle) * dist - 40)}px`,
    rot: `${(i * 67) % 360}deg`,
    color: confettiColors[i % 3],
  };
});

/** Caixa de presente: toca e revela o amigo. */
export function RevealGift({ friendName, children }: { friendName: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Card>
        <div className="flex flex-col items-center gap-6 py-4 text-center">
          <div className="relative h-44 w-48" aria-hidden={open}>
            {!open ? (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="hover-wiggle group relative block h-full w-full"
                aria-label="Abrir presente e ver quem você tirou"
              >
                <GiftBox />
              </button>
            ) : (
              <>
                <div className="absolute inset-0">
                  <GiftBox opened />
                </div>
                {pieces.map((p, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="animate-confetti absolute left-1/2 top-1/3 size-2 rounded-[2px]"
                    style={
                      {
                        background: p.color,
                        "--dx": p.dx,
                        "--dy": p.dy,
                        "--rot": p.rot,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </>
            )}
          </div>

          <div aria-live="polite" className="min-h-24">
            {open ? (
              <div className="animate-name">
                <p className="text-muted">Você tirou</p>
                <p className="mt-1 font-display text-[40px] font-bold leading-[1.1] text-link">
                  {friendName} <span aria-hidden>🎁</span>
                </p>
                <p className="mt-3 text-[13px] text-muted">
                  Não mostra essa tela pra ninguém <span aria-hidden>🤫</span>
                </p>
              </div>
            ) : (
              <Button onClick={() => setOpen(true)}>Abrir presente</Button>
            )}
          </div>
        </div>
      </Card>
      {open && children}
    </div>
  );
}

function GiftBox({ opened = false }: { opened?: boolean }) {
  return (
    <svg viewBox="0 0 192 176" className="h-full w-full" aria-hidden>
      {/* caixa */}
      <rect x="28" y="72" width="136" height="96" rx="8" fill="var(--primary)" />
      <rect x="86" y="72" width="20" height="96" fill="var(--gold)" />
      {/* tampa + laço */}
      <g className={opened ? "animate-lid" : ""} style={{ transformOrigin: "96px 60px" }}>
        <rect x="20" y="52" width="152" height="28" rx="6" fill="var(--primary-hover)" />
        <rect x="86" y="52" width="20" height="28" fill="var(--gold)" />
        <path
          d="M96 52c-10-22-38-26-38-10 0 10 18 12 38 10Zm0 0c10-22 38-26 38-10 0 10-18 12-38 10Z"
          fill="none"
          stroke="var(--gold)"
          strokeWidth="8"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
