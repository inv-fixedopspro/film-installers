import { ReactNode } from "react";

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-foreground mb-4 pb-2 border-b border-border">
        {title}
      </h2>
      <div className="space-y-3 text-[15px] text-muted-foreground leading-relaxed">
        {children}
      </div>
    </section>
  );
}

interface LegalSubSectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSubSection({ title, children }: LegalSubSectionProps) {
  return (
    <div className="mt-5">
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <div className="space-y-2 text-[15px] text-muted-foreground leading-relaxed">
        {children}
      </div>
    </div>
  );
}

interface LegalListProps {
  items: string[];
}

export function LegalList({ items }: LegalListProps) {
  return (
    <ul className="list-disc list-outside ml-5 space-y-1.5 text-[15px] text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
