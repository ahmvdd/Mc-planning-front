import type { Metadata } from "next";
import Navbar from "@/components/navbar";
import OrgTitle from "@/components/org-title";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="app-root" className="min-h-screen bg-zinc-950">
      <div className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
                Shiftly
              </p>
              <OrgTitle />
            </div>
          </div>
          <Navbar />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-6 md:py-10">{children}</main>
      <footer className="mt-16 border-t border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-zinc-600 sm:flex-row">
          <p>
            Fait par{" "}
            <a
              href="https://www.sayehahmed.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-500 hover:text-blue-400 transition-colors"
            >
              Sayeh Ahmed
            </a>
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 font-medium text-amber-500 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            En cours de développement
          </span>
        </div>
      </footer>
    </div>
  );
}
