"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  roleName?: string | null;
  mobile?: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
};

function normalizeRole(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

function isActivePath(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 13h7V4H4v9Zm9 7h7v-5h-7v5Zm0-9h7V4h-7v7Zm-9 9h7v-5H4v5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M16 19a4 4 0 0 0-8 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 7a4 4 0 0 0-4-4m1-9a3 3 0 1 1 0 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ApplicationsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M8 7h8M8 12h8m-8 5h5M7 3h10l3 3v15H4V3h3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TasksIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M9 11l2 2 4-4M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProvidersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M3 21h18M5 21V7l7-4 7 4v14M9 10h6M9 14h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SubagentsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-7 9a7 7 0 0 1 14 0M19 8a2.5 2.5 0 1 1 0 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IntakeFormsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 0v4h4M9 12h6M9 16h6M9 8h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WorkflowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M7 7h4v4H7V7Zm6 0h4v4h-4V7ZM7 13h4v4H7v-4Zm8 2h2m-8-6h4m0 6h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 3v18M5 8h14M5 16h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChecklistIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M9 7h8M9 12h8M9 17h8M5 7h.01M5 12h.01M5 17h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CourseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 4 3 8l9 4 9-4-9-4Zm0 8-9-4v8l9 4 9-4V8l-9 4Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M16 19a4 4 0 0 0-8 0M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 7a4 4 0 0 0-4-4m1-9a3 3 0 1 1 0 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Zm7-3.5 2-1-2-1-.5-2.1-2.1-.5-1-2-1 2-2.1.5-.5 2.1-2 1 2 1 .5 2.1 2.1.5 1 2 1-2 2.1-.5L19 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarItem({
  href,
  label,
  icon,
  collapsed = false,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        collapsed && "justify-center px-2",
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all",
          active
            ? "bg-slate-100 text-slate-900"
            : "bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
        )}
      >
        {icon}
      </span>

      {!collapsed ? <span className="truncate">{label}</span> : null}
      {!collapsed && active ? (
        <span className="ml-auto h-2 w-2 rounded-full bg-slate-900" />
      ) : null}
    </Link>
  );
}

export default function AppSidebar({
  roleName,
  mobile = false,
  collapsed = false,
  onNavigate,
}: Props) {
  const role = normalizeRole(roleName);
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin" || isSuperAdmin;

  const mainItems = [
    { label: "Dashboard", href: "/dashboard", icon: <DashboardIcon /> },
    { label: "Clients", href: "/clients", icon: <ClientsIcon /> },
    { label: "Applications", href: "/applications", icon: <ApplicationsIcon /> },
    { label: "Tasks", href: "/tasks", icon: <TasksIcon /> },
    { label: "Providers", href: "/providers", icon: <ProvidersIcon /> },
    { label: "Subagents", href: "/subagents", icon: <SubagentsIcon /> },
    { label: "Intake Forms", href: "/intake-forms", icon: <IntakeFormsIcon /> },
    {
      label: "Intake Submissions",
      href: "/intake-submissions",
      icon: <IntakeFormsIcon />,
    },
  ];

  const configItems = [
    { label: "Settings", href: "/settings", icon: <SettingsIcon /> },
    { label: "Workflows", href: "/workflows", icon: <WorkflowIcon /> },
    { label: "Lead Sources", href: "/sources", icon: <SourceIcon /> },
    {
      label: "Checklist Templates",
      href: "/settings/checklist-templates",
      icon: <ChecklistIcon />,
    },
    { label: "Courses", href: "/courses-config", icon: <CourseIcon /> },
    ...(isSuperAdmin
      ? [{ label: "Users", href: "/users", icon: <UsersIcon /> }]
      : []),
  ];

  return (
    <aside
      className={cn(
        "flex h-full flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 transition-all duration-300",
        mobile
          ? "w-full max-w-[320px]"
          : collapsed
            ? "hidden w-24 shrink-0 lg:flex"
            : "hidden w-72 shrink-0 lg:flex"
      )}
    >
      <div
        className={cn(
          "border-b border-slate-800",
          collapsed && !mobile ? "px-3 py-6" : "px-5 py-5 sm:px-6 sm:py-6"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed && !mobile && "justify-center"
          )}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sm font-bold text-slate-950">
            CD
          </div>

          {!collapsed || mobile ? (
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                CRM Dynamic
              </p>
              <h1 className="mt-1 truncate text-lg font-semibold text-white">
                Essential CRM
              </h1>
            </div>
          ) : null}
        </div>

        {!collapsed || mobile ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Manage leads, applications, users, and operations from one workspace.
          </p>
        ) : null}
      </div>

      <nav
        className={cn(
          "flex-1 space-y-8 overflow-y-auto py-6",
          collapsed && !mobile ? "px-2" : "px-4"
        )}
      >
        <div>
          {!collapsed || mobile ? (
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Main
            </p>
          ) : null}

          <div
            className={cn(
              "space-y-1.5",
              !collapsed || mobile ? "mt-3" : "mt-0"
            )}
          >
            {mainItems.map((item) => (
              <SidebarItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                collapsed={collapsed && !mobile}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>

        {isAdmin ? (
          <div>
            {!collapsed || mobile ? (
              <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Configuration
              </p>
            ) : null}

            <div
              className={cn(
                "space-y-1.5",
                !collapsed || mobile ? "mt-3" : "mt-0"
              )}
            >
              {configItems.map((item) => (
                <SidebarItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  collapsed={collapsed && !mobile}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ) : null}
      </nav>

      {!collapsed || mobile ? (
        <div className="border-t border-slate-800 px-4 py-4">
          <div className="rounded-2xl bg-slate-800/80 px-4 py-4 ring-1 ring-slate-700/50">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Workspace
            </p>
            <p className="mt-2 text-sm font-medium text-white">Production</p>
            <p className="mt-1 text-xs text-slate-400">
              Secure internal CRM environment
            </p>
          </div>
        </div>
      ) : null}
    </aside>
  );
}