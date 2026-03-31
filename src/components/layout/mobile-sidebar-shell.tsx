"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/sidebar";
import Topbar from "@/components/layout/topbar";

type MobileSidebarShellProps = {
  children: ReactNode;
  userName: string;
  roleName?: string | null;
};

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
};

type SearchItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  type: "client" | "task" | "page";
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ActivityPanel({
  open,
  onClose,
  items,
}: {
  open: boolean;
  onClose: () => void;
  items: ActivityItem[];
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-label="Close activity panel"
      />

      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Notifications
            </h3>
            <p className="text-sm text-gray-500">
              Recent alerts and activity
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>

        <div className="h-[calc(100%-73px)] overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-700">
                No notifications yet
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Your alerts will appear here once connected.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </h4>
                        {item.unread ? (
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-black" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400">
                      {item.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function GlobalSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setItems([]);
      return;
    }

    const controller = new AbortController();

    async function runSearch() {
      const trimmed = query.trim();

      if (!trimmed) {
        setItems([
          {
            id: "page-dashboard",
            title: "Dashboard",
            subtitle: "Open main dashboard overview",
            href: "/dashboard",
            type: "page",
          },
          {
            id: "page-tasks",
            title: "Tasks",
            subtitle: "Open task list",
            href: "/tasks",
            type: "page",
          },
          {
            id: "page-clients",
            title: "Clients",
            subtitle: "Open clients list",
            href: "/clients",
            type: "page",
          },
          {
            id: "page-following",
            title: "My Following",
            subtitle: "Open followed clients portfolio",
            href: "/my-following",
            type: "page",
          },
          {
            id: "page-notifications",
            title: "Notifications",
            subtitle: "Open all notifications",
            href: "/notifications",
            type: "page",
          },
        ]);
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(
          `/api/search/global?q=${encodeURIComponent(trimmed)}`,
          {
            signal: controller.signal,
          }
        );

        const json = await res.json();

        if (res.ok && json.success) {
          setItems(json.data ?? []);
        } else {
          setItems([]);
        }
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Search failed:", error);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(runSearch, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        aria-label="Close search"
      />

      <div className="fixed left-1/2 top-20 z-50 w-[92vw] max-w-2xl -translate-x-1/2 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <SearchIcon />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients, tasks, providers..."
              className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            />
            <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-500">
              ESC
            </span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {loading ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Searching...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
              <p className="text-sm font-medium text-gray-700">
                No results found
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Try another keyword.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className="flex w-full items-start justify-between rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {item.title}
                    </p>
                    <p className="mt-1 truncate text-sm text-gray-500">
                      {item.subtitle}
                    </p>
                  </div>
                  <span className="ml-4 shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-gray-600">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function MobileSidebarShell({
  children,
  userName,
  roleName,
}: MobileSidebarShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isCmdK = event.metaKey && event.key.toLowerCase() === "k";
      const isCtrlK = event.ctrlKey && event.key.toLowerCase() === "k";
      const isEscape = event.key === "Escape";

      if (isEscape) {
        setSearchOpen(false);
        setActivityOpen(false);
        setSidebarOpen(false);
      }

      if (isCmdK || isCtrlK) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activityItems = useMemo<ActivityItem[]>(
    () => [
      {
        id: "1",
        title: "Task assigned",
        description: "A new task was assigned to you.",
        time: "Just now",
        unread: true,
      },
      {
        id: "2",
        title: "Workflow updated",
        description: "A client workflow stage was changed.",
        time: "10 min ago",
      },
      {
        id: "3",
        title: "Follower added",
        description: "A new follower was added to a client record.",
        time: "1 hour ago",
      },
    ],
    []
  );

  const unreadCount = activityItems.filter((item) => item.unread).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div
        className={`hidden lg:block ${
          sidebarCollapsed ? "w-20" : "w-72"
        } shrink-0 transition-all duration-300`}
      >
        <Sidebar roleName={roleName} collapsed={sidebarCollapsed} />
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
          <div className="relative z-50 h-full w-72 max-w-[85vw] bg-transparent shadow-xl">
            <Sidebar
              roleName={roleName}
              collapsed={false}
              onNavigate={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <ActivityPanel
        open={activityOpen}
        onClose={() => setActivityOpen(false)}
        items={activityItems}
      />

      <GlobalSearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative">
          <Topbar
            userName={userName}
            roleName={roleName}
            onMenuClick={() => setSidebarOpen(true)}
            onDesktopSidebarToggle={() =>
              setSidebarCollapsed((prev) => !prev)
            }
            onSearchOpen={() => setSearchOpen(true)}
            onActivityOpen={() => setActivityOpen(true)}
            sidebarCollapsed={sidebarCollapsed}
          />

          {unreadCount > 0 ? (
            <div className="pointer-events-none absolute right-[7.2rem] top-3 hidden sm:flex">
              <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-black px-1.5 text-[11px] font-semibold text-white">
                {unreadCount}
              </span>
            </div>
          ) : null}
        </div>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}