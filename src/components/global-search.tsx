"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, FileText, CalendarClock, Loader2 } from "lucide-react";
import { apiFetchClient } from "@/lib/clientApi";

type SearchResult = { id: number; label: string; sublabel: string; link: string };
type SearchResponse = { employees: SearchResult[]; requests: SearchResult[]; plannings: SearchResult[] };

const GROUPS: { key: keyof SearchResponse; label: string; icon: typeof User }[] = [
  { key: "employees", label: "Employés", icon: User },
  { key: "requests", label: "Demandes", icon: FileText },
  { key: "plannings", label: "Planning", icon: CalendarClock },
];

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      apiFetchClient<SearchResponse>(`/search?q=${encodeURIComponent(query.trim())}`)
        .then((data) => setResults(data))
        .catch(() => setResults(null))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (link: string) => {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(link);
  };

  const hasResults =
    results && (results.employees.length > 0 || results.requests.length > 0 || results.plannings.length > 0);

  return (
    <div className="relative w-full max-w-xs" ref={containerRef}>
      <div className="flex h-11 w-full items-center gap-2.5 rounded-full bg-white px-4 text-sm text-gray-400 shadow-sm dark:bg-white/5 dark:text-white/30 dark:shadow-none">
        {loading ? <Loader2 size={15} className="shrink-0 animate-spin" /> : <Search size={15} className="shrink-0" />}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher..."
          className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 outline-none dark:text-white dark:placeholder:text-white/30"
        />
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 top-14 z-50 w-96 max-w-[90vw] overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 dark:bg-[#161618] dark:ring-white/10">
          <div className="max-h-96 overflow-y-auto">
            {!loading && !hasResults && (
              <p className="px-4 py-8 text-center text-xs text-gray-300 dark:text-white/20">Aucun résultat pour « {query} »</p>
            )}
            {results &&
              GROUPS.map(({ key, label, icon: Icon }) => {
                const items = results[key];
                if (items.length === 0) return null;
                return (
                  <div key={key} className="py-2">
                    <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-gray-300 dark:text-white/20">{label}</p>
                    {items.map((item) => (
                      <button
                        key={`${key}-${item.id}`}
                        type="button"
                        onClick={() => handleSelect(item.link)}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/50">
                          <Icon size={14} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{item.label}</span>
                          <span className="block truncate text-xs text-gray-400 dark:text-white/40">{item.sublabel}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
