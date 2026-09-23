import type { Metadata } from "next";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/topbar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="app-root" className="min-h-screen bg-[#F5F4EF] dark:bg-[#0E0E10]">
      <Sidebar />
      <div className="pl-[104px]">
        <TopBar />
        <main className="px-5 pb-16 pt-6 sm:px-8 md:pt-8">{children}</main>
        <footer className="border-t border-black/5 px-5 sm:px-8 dark:border-white/5">
          <div className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-gray-400 sm:flex-row dark:text-white/30">
            <p>
              Fait par{" "}
              <a
                href="https://www.sayehahmed.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-600 hover:text-gray-900 transition-colors dark:text-white/60 dark:hover:text-white"
              >
                Sayeh Ahmed
              </a>
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              En cours de développement
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
