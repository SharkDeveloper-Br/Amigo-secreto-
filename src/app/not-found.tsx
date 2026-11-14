import Link from "next/link";
import { PackageOpen } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState
      icon={<PackageOpen className="size-12" strokeWidth={1.5} />}
      title="Esse link não existe ou expirou."
      action={
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-[10px] bg-primary px-4 text-[15px] font-semibold text-on-primary hover:bg-primary-hover"
        >
          Criar um grupo
        </Link>
      }
    />
  );
}
