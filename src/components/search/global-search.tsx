"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "client" | "provider" | "course" | "application";
};

type GlobalSearchResponse = {
  query: string;
  clients: SearchItem[];
  providers: SearchItem[];
  courses: SearchItem[];
  applications: SearchItem[];
};

const INITIAL_STATE: GlobalSearchResponse = {
  query: "",
  clients: [],
  providers: [],
  courses: [],
  applications: [],
};

function SearchSection({
  title,
  items,
  onNavigate,
}: {
  title: string;
  items: SearchItem[];
  onNavigate?: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-slate-100 first:border-t-0">
      <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>

      <div className="pb-2">
        {items.map((item) => (
          <Link
            key={`${item.type}-${item.id}`}
            href={item.href}
            onClick={onNavigate}
            className="block px-4 py-3 transition hover:bg-slate-50"
          >
            <div className="text-sm font-medium text-slate-900">{item.title}</div>
            {item.subtitle ? (
              <div className="mt-1 line-clamp-2 text-xs text-slate-500">{item.subtitle}</div>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse>(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const totalResults =
    results.clients.length +
    results.providers.length +
    results.courses.length +
    results.applications.length;

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (abortRef.current) {
      abortRef.current.abort();
    }

    if (trimmed.length < 2) {
      setResults(INITIAL_STATE);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Search failed.");
        }

        setResults(data);
        setOpen(true);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        setResults(INITIAL_STATE);
        setError(error instanceof Error ? error.message : "Search failed.");
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setOpen(true);
            }
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          placeholder="Search clients, providers, courses, applications..."
          className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-200"
          aria-label="Global search"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults(INITIAL_STATE);
              setError("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        ) : null}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {loading ? (
            <div className="px-4 py-4 text-sm text-slate-500">Searching...</div>
          ) : error ? (
            <div className="px-4 py-4 text-sm text-red-600">{error}</div>
          ) : query.trim().length < 2 ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              Type at least 2 characters to search.
            </div>
          ) : totalResults === 0 ? (
            <div className="px-4 py-4 text-sm text-slate-500">
              No results found for “{query.trim()}”.
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              <SearchSection
                title="Clients"
                items={results.clients}
                onNavigate={() => setOpen(false)}
              />
              <SearchSection
                title="Providers"
                items={results.providers}
                onNavigate={() => setOpen(false)}
              />
              <SearchSection
                title="Courses"
                items={results.courses}
                onNavigate={() => setOpen(false)}
              />
              <SearchSection
                title="Applications"
                items={results.applications}
                onNavigate={() => setOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}