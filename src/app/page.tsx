import { Gift, Link2, ListChecks } from "lucide-react";
import { CreateGroupForm } from "@/components/create-group-form";

const steps = [
  { icon: ListChecks, text: "Põe os nomes e as regras" },
  { icon: Gift, text: "Sorteia com um clique" },
  { icon: Link2, text: "Manda o link secreto de cada um" },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] sm:text-[32px]">
          Bora organizar o amigo secreto?
        </h1>
        <p className="mt-3 text-muted">
          Sem cadastro. Cada pessoa recebe um link e só vê quem tirou.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {steps.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-2 text-[15px]">
              <Icon className="size-5 shrink-0 text-gold-text" strokeWidth={1.75} aria-hidden />
              {text}
            </li>
          ))}
        </ul>
      </div>
      <CreateGroupForm />
    </div>
  );
}
