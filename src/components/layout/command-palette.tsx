"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  keywords?: string[];
};

type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  type: "client" | "provider" | "course" | "application";
};

type SearchResponse = {
  query: string;
  clients: SearchResultItem[];
  providers: SearchResultItem[];
  courses: SearchResultItem[];
  applications: SearchResultItem[];
};

type Props = {
  open: boolean;
  onClose: () => void;
  roleName?: string | null;
};

type FlatCommandItem =
  | {
      key: string;
      kind: "nav";
      href: string;
      label: string;
      subtitle?: string;
    }
  | {
      key: string;
      kind: "search";
      href: string;
      label: string;
      subtitle?: string;
      type: SearchResultItem["type"];
    };

const EMPTY_RESULTS: SearchResponse = {
  query: "",
  clients: [],
  providers: [],
  courses: [],
  applications: [],
};

function normalizeRole(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  const trimmed = query.trim();

  if (!trimmed) {
    return <>{text}</>;
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return <>{text}</>;
  }

  const pattern = new RegExp(`(${parts.map(escapeRegExp).join("|")})`, "ig");
  const segments = text.split(pattern);

  return (
    <>
      {segments.map((segment, index) => {
        const isMatch = parts.some((part) => segment.toLowerCase() === part.toLowerCase());

        if (isMatch) {
          return (
            <mark
              key={`${segment}-${index}`}
              className="rounded bg-yellow-100 px-0.5 text-inherit"
            >
              {segment}
            </mark>
          );
        }

        return <span key={`${segment}-${index}`}>{segment}</span>;
      })}
    </>
  );
}

function Section({
  title,
  items,
  onNavigate,
  isActive,
  query,
}: {
  title: string;
  items: SearchResultItem[];
  onNavigate: (href: string) => void;
  isActive: (key: string) => boolean;
  query: string;
}) {
  if (items.length === 0) return null;

  return (
    <div className="border-t border-gray-100 first:border-t-0">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </div>

      <div className="space-y-1 pb-2">
        {items.map((item) => {
          const itemKey = `${item.type}-${item.id}`;
          const active = isActive(itemKey);

          return (
            <button
              key={itemKey}
              type="button"
              onClick={() => onNavigate(item.href)}
              className={`flex w-full items-start justify-between rounded-xl px-3 py-3 text-left transition ${
                active ? "bg-gray-100 ring-1 ring-gray-200" : "hover:bg-gray-50"
              }`}
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  <HighlightedText text={item.title} query={query} />
                </div>
                {item.subtitle ? (
                  <div className="mt-1 truncate text-xs text-gray-500">
                    <HighlightedText text={item.subtitle} query={query} />
                  </div>
                ) : null}
              </div>

              <div className="ml-3 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
                Open
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function CommandPalette({ open, onClose, roleName }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse>(EMPTY_RESULTS);
  const [error, setError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const role = normalizeRole(roleName);
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin" || isSuperAdmin;

  const navItems = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      { label: "Dashboard", href: "/dashboard", keywords: ["home", "overview"] },
      { label: "Clients", href: "/clients", keywords: ["leads", "students"] },
      { label: "Applications", href: "/applications", keywords: ["admissions"] },
      { label: "Tasks", href: "/tasks", keywords: ["todo", "work"] },
      { label: "Providers", href: "/providers", keywords: ["institutes"] },
      { label: "Subagents", href: "/subagents", keywords: ["agents"] },
      { label: "Intake Forms", href: "/intake-forms", keywords: ["forms"] },
      { label: "Intake Submissions", href: "/intake-submissions", keywords: ["submissions"] },
      { label: "Lead Sources", href: "/sources", keywords: ["source"] },
      { label: "Checklist Templates", href: "/settings/checklist-templates", keywords: ["checklist"] },
      { label: "Settings", href: "/settings", keywords: ["config"] },
      { label: "Courses", href: "/courses-config", keywords: ["programs"] },
    ];

    if (isAdmin) {
      base.push({ label: "Workflows", href: "/workflows", keywords: ["stages"] });
    }

    if (isSuperAdmin) {
      base.push({ label: "Users", href: "/users", keywords: ["accounts", "staff"] });
    }

    return base;
  }, [isAdmin, isSuperAdmin]);

  const filteredNavItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return navItems;

    return navItems.filter((item) => {
      const haystack = [item.label, item.href, ...(item.keywords || [])]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [navItems, query]);

  const totalSearchResults =
    searchResults.clients.length +
    searchResults.providers.length +
    searchResults.courses.length +
    searchResults.applications.length;

  const showGlobalResults = query.trim().length >= 2;

  const flatItems = useMemo<FlatCommandItem[]>(() => {
    if (!showGlobalResults) {
      return filteredNavItems.map((item) => ({
        key: `nav-${item.href}`,
        kind: "nav" as const,
        href: item.href,
        label: item.label,
        subtitle: item.href,
      }));
    }

    return [
      ...searchResults.clients.map((item) => ({
        key: `client-${item.id}`,
        kind: "search" as const,
        href: item.href,
        label: item.title,
        subtitle: item.subtitle,
        type: item.type,
      })),
      ...searchResults.providers.map((item) => ({
        key: `provider-${item.id}`,
        kind: "search" as const,
        href: item.href,
        label: item.title,
        subtitle: item.subtitle,
        type: item.type,
      })),
      ...searchResults.courses.map((item) => ({
        key: `course-${item.id}`,
        kind: "search" as const,
        href: item.href,
        label: item.title,
        subtitle: item.subtitle,
        type: item.type,
      })),
      ...searchResults.applications.map((item) => ({
        key: `application-${item.id}`,
        kind: "search" as const,
        href: item.href,
        label: item.title,
        subtitle: item.subtitle,
        type: item.type,
      })),
    ];
  }, [showGlobalResults, filteredNavItems, searchResults]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setLoading(false);
      setError("");
      setSearchResults(EMPTY_RESULTS);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, searchResults, filteredNavItems]);

  useEffect(() => {
    if (flatItems.length === 0) {
      setActiveIndex(0);
      return;
    }

    if (activeIndex > flatItems.length - 1) {
      setActiveIndex(flatItems.length - 1);
    }
  }, [flatItems, activeIndex]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!open) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (flatItems.length === 0) return;
        setActiveIndex((prev) => (prev + 1) % flatItems.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (flatItems.length === 0) return;
        setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
        return;
      }

      if (event.key === "Enter") {
        if (flatItems.length === 0) return;
        event.preventDefault();
        handleNavigate(flatItems[activeIndex].href);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, flatItems, activeIndex]);

  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setSearchResults(EMPTY_RESULTS);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();

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

        let data: SearchResponse | { error?: string } | null = null;

        try {
          data = await response.json();
        } catch {
          throw new Error("Search endpoint returned an invalid response.");
        }

        if (!response.ok) {
          const errorMessage =
            data && typeof data === "object" && "error" in data && typeof data.error === "string"
              ? data.error
              : "Search failed.";

          throw new Error(errorMessage);
        }

        setSearchResults(data as SearchResponse);
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        setSearchResults(EMPTY_RESULTS);
        setError(error instanceof Error ? error.message : "Search failed.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [query, open]);

  function handleNavigate(href: string) {
    onClose();
    router.push(href);
  }

  function isItemActive(key: string) {
    return flatItems[activeIndex]?.key === key;
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 px-4 pt-20 sm:px-6">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close command palette"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
        <div className="border-b border-gray-200 px-4 py-3 sm:px-5">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, providers, courses, applications, pages..."
            className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!showGlobalResults ? (
            filteredNavItems.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">
                No results found
              </div>
            ) : (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Pages
                </div>

                {filteredNavItems.map((item) => {
                  const itemKey = `nav-${item.href}`;
                  const active = isItemActive(itemKey);

                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                        active ? "bg-gray-100 ring-1 ring-gray-200" : "hover:bg-gray-50"
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          <HighlightedText text={item.label} query={query} />
                        </div>
                        <div className="text-xs text-gray-500">
                          <HighlightedText text={item.href} query={query} />
                        </div>
                      </div>

                      <div className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-medium text-gray-500">
                        Open
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : loading ? (
            <div className="px-3 py-6 text-center text-sm text-gray-500">Searching...</div>
          ) : error ? (
            <div className="px-3 py-6 text-center text-sm text-red-600">{error}</div>
          ) : totalSearchResults === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-gray-500">
              No results found
            </div>
          ) : (
            <div className="space-y-0">
              <Section
                title="Clients"
                items={searchResults.clients}
                onNavigate={handleNavigate}
                isActive={isItemActive}
                query={query}
              />
              <Section
                title="Providers"
                items={searchResults.providers}
                onNavigate={handleNavigate}
                isActive={isItemActive}
                query={query}
              />
              <Section
                title="Courses"
                items={searchResults.courses}
                onNavigate={handleNavigate}
                isActive={isItemActive}
                query={query}
              />
              <Section
                title="Applications"
                items={searchResults.applications}
                onNavigate={handleNavigate}
                isActive={isItemActive}
                query={query}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs text-gray-500 sm:px-5">
          <span>Navigate faster across the CRM</span>
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1">
            ↑ ↓ Enter · Esc
          </span>
        </div>
      </div>
    </div>
  );
}