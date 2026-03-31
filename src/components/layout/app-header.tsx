"use client";
import GlobalSearch from "@/components/search/global-search";
import { signOut } from "next-auth/react";

type Props = {
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

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M15 17H9m9-1V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Zm-8 2a2 2 0 1 0 4 0"
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
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4m0-16h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9m0-16v16m4-9-3 3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4m0-16H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h10m0-16v16m-4-9 3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AppHeader({
  userName,
  roleName,
  onMenuClick,
  onDesktopSidebarToggle,
  onSearchOpen,
  onActivityOpen,
  sidebarCollapsed,
}: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>

          <button
            type="button"
            onClick={onDesktopSidebarToggle}
            className="hidden h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 lg:inline-flex"
            aria-label="Toggle sidebar"
          >
            <PanelIcon collapsed={sidebarCollapsed} />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
              Workspace
            </p>
            <h2 className="truncate text-base font-semibold text-gray-900 sm:text-lg">
              {userName}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onSearchOpen}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <SearchIcon />
            <span className="hidden sm:inline">Search</span>
            <span className="hidden rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] text-gray-500 md:inline">
              Ctrl K
            </span>
          </button>

          <button
            type="button"
            onClick={onActivityOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
            aria-label="Open activity panel"
          >
            <BellIcon />
          </button>

          <div className="hidden rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 md:block">
            {formatRole(roleName)}
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:px-4"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}