import Link from "next/link";
import { requireRole } from "@/lib/require-role";

function normalizeRole(value?: string | null) {
  return (value || "").trim().toLowerCase().replace(/\s+/g, "_");
}

type SettingsItem = {
  title: string;
  description: string;
  href: string;
  badge?: string;
  accent: string;
  icon: string;
};

export default async function SettingsPage() {
  const session = await requireRole(["admin", "super_admin"]);

  const roleName = normalizeRole(session.user.roleName);
  const isSuperAdmin = roleName === "super_admin";

  const items: SettingsItem[] = [
    {
      title: "Branches",
      description:
        "Create, manage, and activate branch offices for multi-office operations.",
      href: "/branches",
      badge: "Office Control",
      accent: "from-cyan-500/15 to-cyan-100",
      icon: "⌘",
    },
    {
      title: "Workflows",
      description: "Manage CRM workflows, stage structures, and process design.",
      href: "/workflows",
      badge: "Core Engine",
      accent: "from-indigo-500/15 to-indigo-100",
      icon: "⇄",
    },
    {
      title: "Lead Sources",
      description: "Manage lead source master data and intake attribution.",
      href: "/sources",
      badge: "Acquisition",
      accent: "from-emerald-500/15 to-emerald-100",
      icon: "⌁",
    },
    {
      title: "Checklist Templates",
      description: "Manage reusable document requirement templates and standards.",
      href: "/settings/checklist-templates",
      badge: "Compliance",
      accent: "from-amber-500/15 to-amber-100",
      icon: "☰",
    },
    {
      title: "Courses Configuration",
      description: "Manage providers, course catalogue, and academic setup.",
      href: "/courses-config",
      badge: "Academic Setup",
      accent: "from-violet-500/15 to-violet-100",
      icon: "≣",
    },

    ...(isSuperAdmin
      ? [
          {
            title: "Users",
            description:
              "Create users, assign roles, and control secure account access.",
            href: "/users",
            badge: "Access Control",
            accent: "from-rose-500/15 to-rose-100",
            icon: "◉",
          } satisfies SettingsItem,
        ]
      : []),
  ];

  const topStats = [
    {
      label: "Modules",
      value: items.length,
      valueClass: "text-slate-900",
      accent: "from-slate-500/10 to-slate-100",
    },
    {
      label: "Access Level",
      value: isSuperAdmin ? "Super Admin" : "Admin",
      valueClass: "text-cyan-900",
      accent: "from-cyan-500/10 to-cyan-100",
    },
    {
      label: "Branch Control",
      value: "Enabled",
      valueClass: "text-emerald-900",
      accent: "from-emerald-500/10 to-emerald-100",
    },
    {
      label: "System Mode",
      value: "Operational",
      valueClass: "text-violet-900",
      accent: "from-violet-500/10 to-violet-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-7 text-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.7)] ring-1 ring-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.16),transparent_28%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
              System Configuration
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              General Settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300">
              Manage core CRM configuration, branch offices, workflows, templates,
              academic setup, and platform administration from one premium control
              center.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Role: {isSuperAdmin ? "Super Admin" : "Admin"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Access Scope: Administrative
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                Modules: {items.length}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/branches"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Open Branches
            </Link>

            <Link
              href="/workflows"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-800/70 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open Workflows
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {topStats.map((stat) => (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.accent} opacity-70`}
            />
            <div className="relative">
              <p className="text-sm font-medium text-slate-600">{stat.label}</p>
              <p className={`mt-3 text-2xl font-semibold ${stat.valueClass}`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Administrative Modules
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Configure the platform’s operational, workflow, and office
              management modules.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-70`}
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/70 bg-white/75 text-sm font-bold text-slate-800 shadow-sm">
                    {item.icon}
                  </div>

                  {item.badge ? (
                    <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {item.badge}
                    </span>
                  ) : null}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 transition group-hover:text-slate-700">
                    Open module
                  </span>
                  <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-7">
          <h2 className="text-lg font-semibold text-slate-900">
            Recommended Setup Order
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            A suggested administrative sequence for stable CRM operations.
          </p>

          <div className="mt-5 space-y-3">
            {[
              {
                step: "01",
                title: "Create Branch Offices",
                text: "Set up branches first so users, staff ownership, and office operations can be assigned correctly.",
              },
              {
                step: "02",
                title: "Configure Workflows",
                text: "Define process stages and final-stage outcomes before large-scale client movement begins.",
              },
              {
                step: "03",
                title: "Set Lead Sources",
                text: "Standardize acquisition and intake tracking for clean reporting and attribution.",
              },
              {
                step: "04",
                title: "Prepare Templates",
                text: "Use checklist and communication templates for consistent operations across staff and branches.",
              },
              {
                step: "05",
                title: "Create Users",
                text: "Assign each user the correct role and branch after offices and process structures are ready.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white">
                  {item.step}
                </div>

                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Quick Access
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Jump directly into the most important setup modules.
          </p>

          <div className="mt-5 grid gap-3">
            {[
              { label: "Open Branches", href: "/branches" },
              { label: "Open Workflows", href: "/workflows" },
              { label: "Open Lead Sources", href: "/sources" },
              {
                label: "Open Checklist Templates",
                href: "/settings/checklist-templates",
              },
              { label: "Open Courses Configuration", href: "/courses-config" },
              ...(isSuperAdmin
                ? [{ label: "Open Users", href: "/users" }]
                : []),
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}