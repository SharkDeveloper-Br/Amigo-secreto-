import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Lock, Users } from "lucide-react";
import { JoinForm } from "@/components/join-form";
import { Card } from "@/components/ui";
import { getInviteView } from "@/lib/groups";

export const metadata: Metadata = {
  title: "Convite",
  robots: { index: false, follow: false },
};

async function Invite({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const v = await getInviteView(token);
  if (!v) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gold-text">
          Você foi convidado
        </p>
        <h1 className="mt-1 font-display text-[28px] font-semibold leading-[1.15] sm:text-[32px]">
          {v.groupName}
        </h1>
        <p className="mt-3 inline-flex items-center gap-2 text-muted">
          <Users className="size-4" aria-hidden />
          {v.count === 0
            ? "Seja a primeira pessoa a entrar!"
            : `${v.count} ${v.count === 1 ? "pessoa já entrou" : "pessoas já entraram"}`}
        </p>
      </div>

      <Card>
        {v.drawn ? (
          <div className="flex items-start gap-3">
            <Lock className="mt-1 size-5 shrink-0 text-gold-text" aria-hidden />
            <p>O sorteio já foi feito. Se você ficou de fora, fala com o organizador.</p>
          </div>
        ) : (
          <JoinForm inviteToken={token} />
        )}
      </Card>
    </div>
  );
}

export default function Page(props: PageProps<"/c/[token]">) {
  return (
    <Suspense fallback={<p className="text-muted">Carregando…</p>}>
      <Invite params={props.params} />
    </Suspense>
  );
}
