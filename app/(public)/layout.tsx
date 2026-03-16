import { ReactNode } from "react";
import { Logo } from "@/components/shared";
import { APP_NAME } from "@/lib/constants";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col">
      <header className="p-6">
        <Logo href="/" size="md" />
      </header>
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
      <footer className="p-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}
