import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminPanel } from "@/components/admin-panel";
import { getAdminView } from "@/lib/groups";

export const metadata: Metadata = {
  title: "Painel do organizador",
  robots: { index: false, follow: false },
};

async function Admin({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await getAdminView(token);
  if (!view) notFound();
  return <AdminPanel adminToken={token} view={view} />;
}

export default function Page(props: PageProps<"/g/[token]">) {
  return (
    <Suspense fallback={<p className="text-muted">Carregando…</p>}>
      <Admin params={props.params} />
    </Suspense>
  );
}
