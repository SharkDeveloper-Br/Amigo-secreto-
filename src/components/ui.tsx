import type { ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "bg-secondary text-on-secondary hover:opacity-90",
  ghost: "bg-transparent text-text hover:bg-border/50",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] px-4 text-[15px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-border bg-surface p-4 shadow-card sm:p-6 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-[22px] font-semibold leading-tight">{children}</h2>;
}

export const inputClass =
  "w-full min-h-11 rounded-[10px] border border-border bg-surface px-3 py-2 text-base text-text placeholder:text-muted/70 outline-none focus-visible:outline-2 focus-visible:outline-gold aria-[invalid=true]:border-danger";

export function ErrorText({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-[13px] text-danger">
      {children}
    </p>
  );
}

export function EmptyState({
  icon,
  title,
  action,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <div className="text-gold" aria-hidden>
        {icon}
      </div>
      <p className="max-w-xs text-muted">{title}</p>
      {action}
    </div>
  );
}
