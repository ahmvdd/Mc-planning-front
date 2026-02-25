import Navbar from "@/components/navbar";
import OrgTitle from "@/components/org-title";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-3 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
              MC
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                MCPlanning
              </p>
              <OrgTitle />
            </div>
          </div>
          <Navbar />
        </div>
      </div>
      <main className="mx-auto w-full max-w-6xl px-3 sm:px-6 py-6 md:py-10">{children}</main>
      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-xs text-slate-400 sm:flex-row">
          <p>
            Fait par{" "}
            <a
              href="https://www.sayehahmed.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Sayeh Ahmed
            </a>
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-600 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            En cours de développement
          </span>
        </div>
      </footer>
    </div>
  );
}
