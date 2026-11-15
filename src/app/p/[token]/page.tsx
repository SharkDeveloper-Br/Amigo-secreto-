import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Hourglass } from "lucide-react";
import { RevealGift } from "@/components/reveal-gift";
import { SaveLinkBanner } from "@/components/save-link-banner";
import { Card, SectionTitle } from "@/components/ui";
import { WishlistForm } from "@/components/wishlist-form";
import { getParticipantView } from "@/lib/groups";

export const metadata: Metadata = {
  title: "Seu amigo secreto",
  robots: { index: false, follow: false },
};

async function Participant({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const isNew = (await searchParams).novo === "1";
  const v = await getParticipantView(token);
  if (!v) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[13px] font-semibold uppercase tracking-wide text-gold-text">
          {v.groupName}
        </p>
        <h1 className="mt-1 font-display text-[28px] font-semibold leading-[1.15] sm:text-[32px]">
          Oi, {v.name}!
        </h1>
      </div>

      {isNew && <SaveLinkBanner />}

      {v.friend ? (
        <RevealGift friendName={v.friend.name}>
          <Card className="mt-6">
            <SectionTitle>O que {v.friend.name} quer ganhar</SectionTitle>
            {v.friend.wishlist.trim() ? (
              <p className="mt-3 whitespace-pre-wrap break-words">{v.friend.wishlist}</p>
            ) : (
              <p className="mt-3 text-muted">
                {v.friend.name} ainda não escreveu a lista. Volta aqui depois!
              </p>
            )}
          </Card>
        </RevealGift>
      ) : (
        <Card>
          <div className="flex items-start gap-3">
            <Hourglass className="mt-1 size-5 shrink-0 text-gold-text" aria-hidden />
            <p>O sorteio ainda não rolou. Quando rolar, volta neste link pra ver quem você tirou. Enquanto isso, pode mexer na sua lista de desejos.</p>
          </div>
        </Card>
      )}

      <Card>
        <WishlistForm token={token} initial={v.wishlist} />
      </Card>
    </div>
  );
}

export default function Page(props: PageProps<"/p/[token]">) {
  return (
    <Suspense fallback={<p className="text-muted">Carregando…</p>}>
      <Participant params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
