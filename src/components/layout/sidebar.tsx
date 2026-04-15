"use client";

import Link from "next/link";
import { useMemo, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type SidebarProps = {
  roleName?: string | null;
  collapsed?: boolean;
  onNavigate?: () => void;
};

type NavItemType = {
  id: string;
  href: string;
  label: string;
  icon: string;
  matchStartsWith?: boolean;
  showUnreadBadge?: boolean;
  highlight?: boolean;
};

type NavSectionType = {
  title?: string;
  items: NavItemType[];
};

function normalizeRole(roleName?: string | null) {
  return (roleName || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function isItemActive(pathname: string, item: NavItemType) {
  if (item.matchStartsWith) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return pathname === item.href;
}

export default function Sidebar({
  roleName,
  collapsed = false,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const pollingRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const role = normalizeRole(roleName);
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin" || isSuperAdmin;

  async function loadUnreadCount() {
    if (pollingRef.current) return;

    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      return;
    }

    pollingRef.current = true;

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("/api/notifications?limit=1", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return;
      }

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        return;
      }

      const data = (await response.json()) as {
        unreadCount?: number;
      };

      setUnreadCount(data.unreadCount ?? 0);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      if (process.env.NODE_ENV === "development") {
        console.warn("Sidebar unread count fetch skipped:", error);
      }
    } finally {
      pollingRef.current = false;
    }
  }

  useEffect(() => {
    void loadUnreadCount();

    const interval = window.setInterval(() => {
      void loadUnreadCount();
    }, 20000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadUnreadCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const sections = useMemo<NavSectionType[]>(() => {
    const main: NavSectionType = {
      items: [
        { id: "dashboard", href: "/dashboard", label: "Dashboard", icon: "⌂" },
        {
          id: "leads",
          href: "/leads",
          label: "Leads",
          icon: "◉",
          matchStartsWith: true,
        },
        {
          id: "clients",
          href: "/clients",
          label: "Clients",
          icon: "◌",
          matchStartsWith: true,
        },
        {
          id: "my-following",
          href: "/my-following",
          label: "My Following",
          icon: "◎",
          matchStartsWith: true,
        },
        {
          id: "applications",
          href: "/applications",
          label: "Applications",
          icon: "▣",
          matchStartsWith: true,
        },
        {
          id: "tasks",
          href: "/tasks",
          label: "Tasks",
          icon: "✓",
          matchStartsWith: true,
        },
        {
          id: "notifications",
          href: "/notifications",
          label: "Notifications",
          icon: "◈",
          matchStartsWith: true,
          showUnreadBadge: true,
        },
      ],
    };

    const operations: NavSectionType = {
      title: "Operations",
      items: [
        {
          id: "providers",
          href: "/providers",
          label: "Providers",
          icon: "▤",
          matchStartsWith: true,
        },
        {
          id: "courses",
          href: "/courses-config",
          label: "Courses",
          icon: "≣",
          matchStartsWith: true,
        },
        {
          id: "subagents",
          href: "/subagents",
          label: "Agents",
          icon: "◍",
          matchStartsWith: true,
        },
        {
          id: "intake-forms",
          href: "/intake-forms",
          label: "Intake Forms",
          icon: "✎",
          matchStartsWith: true,
        },
      ],
    };

    const communication: NavSectionType = {
      title: "Communication",
      items: [
        {
          id: "email-center",
          href: "/email-center",
          label: "Email Center",
          icon: "✦",
          matchStartsWith: true,
          highlight: true,
        },
      ],
    };

    const settings: NavSectionType = {
      title: "Settings",
      items: [
        {
          id: "general-settings",
          href: "/settings",
          label: "General Settings",
          icon: "⚙",
          matchStartsWith: true,
        },
        {
          id: "lead-sources",
          href: "/sources",
          label: "Lead Sources",
          icon: "⌁",
          matchStartsWith: true,
        },
        {
          id: "workflows",
          href: "/workflows",
          label: "Workflows",
          icon: "⇄",
          matchStartsWith: true,
        },
        {
          id: "checklist-templates",
          href: "/settings/checklist-templates",
          label: "Checklist Templates",
          icon: "☰",
          matchStartsWith: true,
        },
      ],
    };

    const admin: NavSectionType | null = isAdmin
      ? {
          title: "Admin",
          items: [
            {
              id: "audit-logs",
              href: "/audit-logs",
              label: "Audit Logs",
              icon: "◆",
              matchStartsWith: true,
            },
            {
              id: "reports",
              href: "/reports",
              label: "Reports",
              icon: "◫",
              matchStartsWith: true,
              highlight: true,
            },
          ],
        }
      : null;

    return admin
      ? [main, operations, communication, settings, admin]
      : [main, operations, communication, settings];
  }, [isAdmin]);

  return (
    <aside
      className={`flex h-full flex-col overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] text-white shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div
        className={`border-b border-white/10 ${
          collapsed ? "px-3 py-5" : "px-5 py-5"
        }`}
      >
        <div
          className={`flex items-center gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-lg font-bold shadow-inner ring-1 ring-white/10">
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent" />
            <span className="absolute inset-0 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" />
            <span className="relative">CRM</span>
          </div>

          {!collapsed ? (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-white">
                CRM Dynamic
              </h1>
              <p className="truncate text-xs text-slate-400">
                Operations workspace
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto ${
          collapsed ? "px-2 py-4" : "px-4 py-4"
        }`}
      >
        <nav className="space-y-5">
          {sections.map((section, sectionIndex) => (
            <div key={`section-${sectionIndex}`} className="space-y-2">
              {section.title && !collapsed ? (
                <div className="flex items-center gap-3 px-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {section.title}
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                </div>
              ) : null}

              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const active = isItemActive(pathname, item);
                  const showUnreadBadge =
                    item.showUnreadBadge && unreadCount > 0;

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl text-sm font-medium transition-all duration-200 ${
                        collapsed
                          ? "justify-center px-2 py-3"
                          : "px-3 py-3"
                      } ${
                        active
                          ? "bg-white text-slate-900 shadow-[0_12px_28px_rgba(255,255,255,0.18)] ring-1 ring-white/80"
                          : item.highlight
                          ? "bg-white/[0.06] text-white ring-1 ring-white/10 hover:bg-white/[0.10]"
                          : "text-slate-300 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {!active ? (
                        <span className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-white/[0.04] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      ) : null}

                      {item.highlight && !active ? (
                        <span className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-cyan-400/10 to-transparent" />
                      ) : null}

                      <span
                        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm transition ${
                          active
                            ? "bg-slate-900/8 text-slate-900"
                            : item.highlight
                            ? "bg-gradient-to-br from-cyan-400/15 to-violet-400/10 text-cyan-200 ring-1 ring-cyan-300/10"
                            : "bg-white/5 text-slate-300 group-hover:bg-white/10 group-hover:text-white"
                        }`}
                      >
                        {item.icon}
                      </span>

                      {!collapsed ? (
                        <span className="relative truncate">{item.label}</span>
                      ) : null}

                      {!collapsed && item.highlight && !active ? (
                        <span className="ml-auto rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                          New
                        </span>
                      ) : null}

                      {!collapsed && showUnreadBadge ? (
                        <span
                          className={`relative ml-auto flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold shadow ${
                            active
                              ? "bg-slate-900 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      ) : null}

                      {!collapsed && active && !showUnreadBadge ? (
                        <span className="relative ml-auto h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                      ) : null}

                      {collapsed && showUnreadBadge ? (
                        <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {!collapsed ? (
        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">
                  System Status
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  Followers, assignments, notifications, search, activity, and
                  communication foundations are active.
                </div>
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-400/20">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
              Operational
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 p-3">
          <div className="flex justify-center">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.9)]" />
          </div>
        </div>
      )}
    </aside>
  );
}