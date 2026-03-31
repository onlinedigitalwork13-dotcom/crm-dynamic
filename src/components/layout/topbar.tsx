"use client";

import { signOut } from "next-auth/react";
import NotificationBell from "./notification-bell";

type TopbarProps = {
  userName: string;
  roleName?: string | null;
  onMenuClick?: () => void;
  onDesktopSidebarToggle?: () => void;
  onSearchOpen?: () => void;
  onActivityOpen?: () => void;
  sidebarCollapsed?: boolean;
};

function formatRole(value?: string | null) {
  if (!value) return "User";

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

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

function PanelIcon({ collapsed }: { collapsed?: boolean }) {
  return collapsed ? (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4m0-16h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9m0-16v16m4-9-3 3 3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4m0-16H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10m0-16v16m-4-9 3 3-3 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M15 16l4-4-4-4M9 12h10M9 20H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Topbar({
  userName,
  roleName,
  onMenuClick,
  onDesktopSidebarToggle,
  onSearchOpen,
  sidebarCollapsed,
}: TopbarProps) {
  const initials = getInitials(userName);
  const roleLabel = formatRole(roleName);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:hidden"
              aria-label="Open menu"
            >
              <MenuIcon />
            </button>

            <button
              type="button"
              onClick={onDesktopSidebarToggle}
              className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 lg:inline-flex"
              aria-label="Toggle sidebar"
            >
              <PanelIcon collapsed={sidebarCollapsed} />
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white sm:flex">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Workspace
                </p>
                <h2 className="truncate text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
                  {userName}
                </h2>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onSearchOpen}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <SearchIcon />
              <span className="hidden sm:inline">Search</span>
              <span className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-500 md:inline">
                Ctrl K
              </span>
            </button>

            <div className="flex h-11 items-center">
              <NotificationBell />
            </div>

            <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 shadow-sm md:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="max-w-[140px] truncate text-sm font-medium text-slate-900">
                  {userName}
                </p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 sm:px-4"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}