import Link from "next/link";

const stats = [
  {
    title: "Multi-branch",
    description: "Branch-ready structure for scalable operations.",
  },
  {
    title: "Dynamic CRM",
    description: "Workflow-driven operations with configurable movement.",
  },
  {
    title: "End-to-end",
    description: "Lead to enrollment journey in one connected system.",
  },
];

const features = [
  {
    title: "Dynamic Workflows",
    description:
      "Configure journeys, stages, and operational movement without rebuilding the platform every time the process evolves.",
  },
  {
    title: "Client & Intake Engine",
    description:
      "Capture new prospects, manage public intake forms, and move submissions into clean internal workflows with clarity.",
  },
  {
    title: "Provider & Course Control",
    description:
      "Track providers, courses, offerings, and linked opportunities inside one connected operational workspace.",
  },
  {
    title: "Application Management",
    description:
      "Monitor submissions, progression, milestones, and client application journeys with stronger visibility and structure.",
  },
  {
    title: "Task & Team Execution",
    description:
      "Coordinate staff assignments, actions, follow-ups, and responsibilities across teams without operational confusion.",
  },
  {
    title: "Check-In & Front Desk Flow",
    description:
      "Support walk-ins and reception handling with a direct path into the CRM so front desk activity is never disconnected.",
  },
];

const modulePills = [
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
];

const intelligenceBlocks = [
  {
    label: "Client Pipeline",
    value: "Structured",
    description: "Workflow, stages, follow-up, assignment, and visibility.",
  },
  {
    label: "Intake & Forms",
    value: "Connected",
    description: "Public intake to internal processing without messy handoff.",
  },
  {
    label: "Applications",
    value: "Tracked",
    description: "Courses, providers, submissions, and progression in one flow.",
  },
  {
    label: "Team Execution",
    value: "Aligned",
    description: "Tasks, branch coordination, and operational accountability.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] text-slate-900">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(129,140,248,0.16),transparent_26%),radial-gradient(circle_at_70%_30%,rgba(15,23,42,0.05),transparent_26%),linear-gradient(to_bottom,rgba(255,255,255,0.96),rgba(241,245,249,0.96))]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] [background-size:36px_36px]" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24">
          <header className="rounded-full border border-white/70 bg-white/80 px-4 py-3 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.18)] backdrop-blur-xl md:px-6">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white shadow-lg">
                  C
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-slate-950">
                    CRM Dynamic
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Education & Migration Operations Platform
                  </p>
                </div>
              </Link>

              <nav className="hidden items-center gap-7 lg:flex">
                <a
                  href="#features"
                  className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
                >
                  Features
                </a>
                <a
                  href="#why"
                  className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
                >
                  Why It Wins
                </a>
                <a
                  href="#modules"
                  className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
                >
                  Modules
                </a>
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_20px_-10px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Open CRM
                </Link>
              </div>
            </div>
          </header>

          <section className="grid gap-14 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-20">
            <div>
              <div className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-blue-700 shadow-sm">
                World-class CRM foundation
              </div>

              <h1 className="mt-6 max-w-4xl text-[42px] font-semibold leading-[0.96] tracking-[-0.05em] text-slate-950 sm:text-[58px] lg:text-[72px]">
                A premium CRM
                <br />
                experience for education,
                <br />
                migration, and modern
                <br />
                operations.
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Replace scattered spreadsheets, disconnected follow-ups, and
                manual operational chaos with a structured platform built for
                client journeys, intake, applications, staff coordination, and
                scalable branch operations.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(15,23,42,0.55)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Start Secure Sign In
                </Link>
                <Link
                  href="/check-in"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  Open Check-In Flow
                </Link>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {stats.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-[24px] border border-slate-200 bg-white/90 p-5 shadow-[0_16px_40px_-22px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-24px_rgba(15,23,42,0.22)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <div className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-[0_0_18px_rgba(59,130,246,0.55)]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 bg-[radial-gradient(circle_at_center,rgba(15,23,42,0.16),transparent_44%)] blur-3xl" />
              <div className="absolute -inset-2 rounded-[36px] bg-gradient-to-br from-slate-200/60 via-blue-100/70 to-indigo-100/60 blur-2xl" />

              <div className="relative overflow-hidden rounded-[34px] border border-slate-900/10 bg-[#040b23] p-4 text-white shadow-[0_40px_100px_-32px_rgba(15,23,42,0.6)] sm:p-5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.12),transparent_28%)]" />

                <div className="relative rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                        Operations Overview
                      </p>
                      <h2 className="mt-1 text-[26px] font-semibold tracking-tight text-white">
                        CRM Intelligence Panel
                      </h2>
                    </div>

                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                      Live Ready
                    </div>
                  </div>
                </div>

                <div className="relative mt-4 grid gap-4 sm:grid-cols-2">
                  {intelligenceBlocks.map((block) => (
                    <div
                      key={block.label}
                      className="rounded-[22px] border border-white/10 bg-white/[0.035] p-5 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.055]"
                    >
                      <p className="text-sm text-slate-300">{block.label}</p>
                      <p className="mt-3 text-[22px] font-semibold tracking-tight text-white sm:text-[25px]">
                        {block.value}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {block.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="relative mt-4 rounded-[24px] border border-white/10 bg-white/[0.035] p-5">
                  <p className="text-sm text-slate-300">
                    Built for high-clarity operations
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      "Education CRM",
                      "Migration Operations",
                      "Lead Conversion",
                      "Workflow Automation",
                      "Team Productivity",
                      "Branch Collaboration",
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-200"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <section
        id="why"
        className="border-y border-slate-200 bg-white/60 backdrop-blur"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr_0.95fr]">
            <div className="rounded-[28px] border border-transparent bg-transparent p-1">
              <div className="h-full rounded-[24px] bg-transparent p-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Why it feels premium
                </p>
                <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Designed to look sharp,
                  <br />
                  move fast, and scale cleanly.
                </h2>
              </div>
            </div>

            <div className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-26px_rgba(15,23,42,0.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-28px_rgba(15,23,42,0.2)]">
              <div className="mb-4 h-11 w-11 rounded-2xl bg-slate-100" />
              <h3 className="text-xl font-semibold text-slate-950">
                Clear visual hierarchy
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Strong sections, balanced spacing, premium cards, and clean
                emphasis make the platform feel trustworthy from the first
                screen.
              </p>
            </div>

            <div className="group rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-26px_rgba(15,23,42,0.16)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_55px_-28px_rgba(15,23,42,0.2)]">
              <div className="mb-4 h-11 w-11 rounded-2xl bg-slate-100" />
              <h3 className="text-xl font-semibold text-slate-950">
                Responsive by default
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The layout is designed to stay polished across desktop, tablet,
                and mobile without collapsing into a cramped stacked experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
            Core strengths
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            A homepage that reflects the product behind it.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            The public entry point should communicate trust, capability, and
            software maturity instantly — not look like a temporary placeholder.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-26px_rgba(15,23,42,0.16)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-28px_rgba(15,23,42,0.22)]"
            >
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
                CRM Module
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="modules"
        className="relative overflow-hidden bg-slate-950 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.14),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                Built for serious operations
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Not just a dashboard.
                <br />
                A full operational command layer.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-300">
                From leads and intake to applications, documents, tasks,
                notifications, and reporting, the experience should feel
                cohesive, premium, and unmistakably product-grade.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-200"
                >
                  Access Platform
                </Link>
                <Link
                  href="/forms"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  Open Forms
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {modulePills.map((item) => (
                <div
                  key={item}
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-medium text-slate-100 transition duration-300 hover:-translate-y-1 hover:bg-white/[0.08]"
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
          <p>
            CRM Dynamic — premium operations software for education and
            migration teams.
          </p>

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