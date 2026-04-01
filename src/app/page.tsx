import Link from "next/link";

const stats = [
  { label: "Branch-ready structure", value: "Multi-branch" },
  { label: "Workflow-driven operations", value: "Dynamic CRM" },
  { label: "Lead to enrollment journey", value: "End-to-end" },
];

const features = [
  {
    title: "Dynamic Workflows",
    description:
      "Build and manage client journeys with configurable workflows, stages, and operational visibility tailored for education and migration teams.",
  },
  {
    title: "Client & Intake Engine",
    description:
      "Capture leads, manage intake forms, track submissions, and move prospects into active client pipelines with clean operational flow.",
  },
  {
    title: "Provider & Course Management",
    description:
      "Organise providers, courses, applications, and progression paths in one connected workspace designed for real operational use.",
  },
  {
    title: "Task & Team Coordination",
    description:
      "Assign, follow up, and monitor staff actions with a CRM structure built for accountability, speed, and branch collaboration.",
  },
  {
    title: "Check-In & Front Desk Flow",
    description:
      "Support reception and walk-in experiences with structured check-in handling tied directly into the CRM ecosystem.",
  },
  {
    title: "Production-Ready Foundation",
    description:
      "Built for real teams with role-based access, modular architecture, scalable data structure, and future-ready expansion paths.",
  },
];

const pillars = [
  "Education CRM",
  "Migration Operations",
  "Lead Conversion",
  "Workflow Automation",
  "Team Productivity",
  "Branch Collaboration",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_28%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.14),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.08),transparent_28%)]" />
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between rounded-full border border-slate-200/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur md:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-lg">
                C
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">CRM Dynamic</p>
                <p className="text-xs text-slate-500">
                  Education & Migration Operations Platform
                </p>
              </div>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
              <a href="#features" className="text-sm text-slate-600 transition hover:text-slate-950">
                Features
              </a>
              <a href="#why" className="text-sm text-slate-600 transition hover:text-slate-950">
                Why It Wins
              </a>
              <a href="#modules" className="text-sm text-slate-600 transition hover:text-slate-950">
                Modules
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sign In
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open CRM
              </Link>
            </div>
          </header>

          <div className="grid gap-12 px-1 pb-12 pt-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pt-20">
            <div>
              <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                World-class CRM foundation
              </div>

              <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                A premium CRM experience for education, migration, and modern
                client operations.
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Replace scattered spreadsheets, disconnected follow-ups, and
                manual operational chaos with a structured platform built for
                client journeys, intake, applications, team collaboration, and
                scalable branch operations.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Start Secure Sign In
                </Link>
                <Link
                  href="/check-in"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Open Check-In Flow
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm"
                  >
                    <div className="text-lg font-semibold text-slate-950">
                      {item.value}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-br from-slate-200 via-blue-100 to-indigo-100 blur-2xl opacity-60" />
              <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_30px_80px_-25px_rgba(15,23,42,0.55)]">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-300">
                      Operations Overview
                    </p>
                    <h2 className="mt-1 text-lg font-semibold">
                      CRM Intelligence Panel
                    </h2>
                  </div>
                  <div className="rounded-xl bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Live Ready
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Client Pipeline</p>
                    <p className="mt-2 text-3xl font-semibold">Structured</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Workflow, stages, follow-up, assignment, and visibility.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Intake & Forms</p>
                    <p className="mt-2 text-3xl font-semibold">Connected</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Public intake to internal processing without messy handoff.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Applications</p>
                    <p className="mt-2 text-3xl font-semibold">Tracked</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Courses, providers, submissions, and progression in one flow.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Team Execution</p>
                    <p className="mt-2 text-3xl font-semibold">Aligned</p>
                    <p className="mt-2 text-sm text-slate-400">
                      Tasks, branch coordination, and operational accountability.
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm text-slate-300">Built for high-clarity operations</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {pillars.map((pillar) => (
                      <span
                        key={pillar}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-slate-200"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Why it feels premium
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                Designed to look sharp, move fast, and scale cleanly.
              </h2>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">
                Clear visual hierarchy
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Strong sections, balanced spacing, clean cards, and enterprise-grade
                polish make the platform feel trustworthy from the first screen.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-950">
                Responsive by default
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The layout is built to feel polished across desktop, tablet, and
                mobile without turning into a stacked mess.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Core strengths
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            A landing page that reflects the power of the system behind it.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            This public entry point should instantly communicate trust, capability,
            and modern product maturity instead of looking like a dev placeholder.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="inline-flex rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
                CRM Module
              </div>
              <h3 className="mt-4 text-xl font-semibold text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" className="bg-slate-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
                Built for serious operations
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                Not just a dashboard. A full operational command layer.
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                From leads and intake to applications, documents, team tasks,
                notifications, and reporting, the experience should feel cohesive,
                premium, and unmistakably enterprise-grade.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Access Platform
                </Link>
                <Link
                  href="/forms"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Open Forms
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Clients",
                "Leads",
                "Intake Forms",
                "Submissions",
                "Applications",
                "Providers",
                "Courses",
                "Tasks",
                "Notifications",
                "Workflows",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-slate-100"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p>CRM Dynamic — premium operations software for education and migration teams.</p>
          <div className="flex gap-4">
            <Link href="/login" className="transition hover:text-slate-950">
              Login
            </Link>
            <Link href="/dashboard" className="transition hover:text-slate-950">
              Dashboard
            </Link>
            <Link href="/check-in" className="transition hover:text-slate-950">
              Check-In
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}