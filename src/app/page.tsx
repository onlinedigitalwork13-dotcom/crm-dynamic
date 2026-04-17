"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";

const heroStats = [
  {
    value: "All-in-one",
    title: "Operations CRM",
    description:
      "Manage leads, clients, intake, applications, tasks, and workflows from one connected platform.",
  },
  {
    value: "Modern UI",
    title: "Premium experience",
    description:
      "A cleaner, more advanced interface built to look trustworthy and feel enterprise-ready.",
  },
  {
    value: "Built to scale",
    title: "Multi-branch ready",
    description:
      "Support growing education and migration teams with better visibility and control.",
  },
];

const platformScreens = [
  {
    eyebrow: "Executive overview",
    title: "Executive Control at a Glance",
    description:
      "Track clients, leads, applications, tasks, providers, courses, and check-ins from one premium command layer.",
    image: "/home/dashboard-overview.png",
    alt: "CRM Dynamic dashboard overview",
    reverse: false,
  },
  {
    eyebrow: "Task workspace",
    title: "Smart Task and Workflow Management",
    description:
      "Assign, manage, and monitor follow-up across the team with clear ownership and cleaner execution.",
    image: "/home/tasks-workspace.png",
    alt: "CRM Dynamic tasks workspace",
    reverse: true,
  },
  {
    eyebrow: "Reception desk",
    title: "Fast Client Check-In and Identity Resolution",
    description:
      "Search by phone, email, or passport number to resolve identity before creating or updating a live CRM record.",
    image: "/home/checkin-screen.png",
    alt: "CRM Dynamic check-in screen",
    reverse: false,
  },
  {
    eyebrow: "Public intake",
    title: "Structured Intake Without Duplicate Records",
    description:
      "Guide new enquiries through a clean search-first intake flow that keeps your CRM more accurate from day one.",
    image: "/home/intake-form.png",
    alt: "CRM Dynamic intake form",
    reverse: true,
  },
  {
    eyebrow: "Provider import",
    title: "Clean Provider Import Pipeline",
    description:
      "Import provider data from CSV, website, or API with validation, duplicate detection, and safer preview before commit.",
    image: "/home/provider-import.png",
    alt: "CRM Dynamic provider import screen",
    reverse: false,
  },
  {
    eyebrow: "Course import",
    title: "Structured Course Import With Validation",
    description:
      "Import provider-linked course data through a production-ready pipeline with deduplication and review before final commit.",
    image: "/home/course-import.png",
    alt: "CRM Dynamic course import screen",
    reverse: true,
  },
  {
    eyebrow: "System settings",
    title: "Centralized Configuration for Real Operations",
    description:
      "Control branches, workflows, lead sources, checklist templates, academic setup, and users from one administrative layer.",
    image: "/home/settings-overview.png",
    alt: "CRM Dynamic general settings screen",
    reverse: false,
  },
  {
    eyebrow: "Email center",
    title: "Workflow-Linked Communication Hub",
    description:
      "Manage rules, template keys, channels, and targets through a clean email center built around real automation logic.",
    image: "/home/email-center.png",
    alt: "CRM Dynamic email center screen",
    reverse: true,
  },
];

const features = [
  {
    title: "Lead and Intake Capture",
    description:
      "Collect public enquiries, walk-ins, and intake submissions in one connected system.",
  },
  {
    title: "Client Journey Management",
    description:
      "Track every student or client from first contact through each operational stage.",
  },
  {
    title: "Workflow Automation",
    description:
      "Move records through structured stages with cleaner internal execution and follow-up.",
  },
  {
    title: "Applications Tracking",
    description:
      "Manage providers, courses, submissions, milestones, and application progression in one place.",
  },
  {
    title: "Task and Team Execution",
    description:
      "Coordinate staff assignments, reminders, actions, and operational accountability across teams.",
  },
  {
    title: "Front Desk Check-In",
    description:
      "Handle reception flow with CRM-linked search, lookup, and intake before record creation.",
  },
];

const comparisonRows = [
  {
    other: "Spreadsheets, email, WhatsApp, and disconnected tools",
    dynamic:
      "One connected platform for leads, clients, applications, intake, tasks, and workflows",
  },
  {
    other: "Hard to track the full student or client journey",
    dynamic: "Clear operational movement from first enquiry to outcome",
  },
  {
    other: "Missed follow-up and weak accountability",
    dynamic: "Structured ownership, workflow progression, and team visibility",
  },
  {
    other: "Generic CRM not built for your industry process",
    dynamic: "Purpose-built for education and migration operations",
  },
  {
    other: "No reception or intake flow built in",
    dynamic: "Check-in, search-first intake, and workflow-ready forms all connected",
  },
];

const modules = [
  "Clients",
  "Leads",
  "Check-In",
  "Intake Forms",
  "Applications",
  "Providers",
  "Courses",
  "Tasks",
  "Notifications",
  "Workflows",
  "Settings",
  "Email Center",
];

const testimonials = [
  {
    quote:
      "CRM Dynamic gave our team a much clearer way to manage leads, check-ins, and applications. The workflow is faster, cleaner, and much easier for staff to follow every day.",
    name: "Ava Thompson",
    role: "Operations Manager, Southern Bridge Education",
  },
  {
    quote:
      "We were using too many disconnected tools before. This platform helped us centralize our intake, task management, and provider workflows in one place.",
    name: "Daniel Brooks",
    role: "Director, Horizon Migration Advisory",
  },
  {
    quote:
      "The product looks premium and the structure behind it is strong. We especially like the provider and course import flow because it makes data control much easier.",
    name: "Mia Collins",
    role: "Compliance Lead, Future Pathways Group",
  },
];

const officePhotos = [
  {
    src: "/home/office-1.png",
    alt: "Modern reception interior",
  },
  {
    src: "/home/office-2.png",
    alt: "Modern conference room interior",
  },
  {
    src: "/home/office-3.png",
    alt: "Modern open office interior",
  },
];

const fadeUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
    },
  },
};

const stagger: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

function DarkEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-sky-300/90">
      {children}
    </p>
  );
}

function LightEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
      {children}
    </p>
  );
}

function GlowCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ duration: 0.25 }}
      className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.05] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.16),transparent_35%)] opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#06101f] text-white selection:bg-sky-400/20 selection:text-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_26%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_24%),radial-gradient(circle_at_center,rgba(15,23,42,0.45),transparent_52%),linear-gradient(180deg,#020817_0%,#071124_40%,#0b1220_100%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute left-0 top-32 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pb-24">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="sticky top-4 z-50 rounded-full border border-white/10 bg-white/5 px-4 py-3 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-xl md:px-6"
          >
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg">
                  <Image
                    src="/home/logo.png"
                    alt="CRM Dynamic logo"
                    width={44}
                    height={44}
                    className="h-11 w-11 object-contain"
                    unoptimized
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold tracking-tight text-white">
                    CRM Dynamic
                  </p>
                  <p className="truncate text-xs text-slate-300">
                    Education and Migration Operations Platform
                  </p>
                </div>
              </Link>

              <nav className="hidden items-center gap-7 lg:flex">
                <a href="#platform" className="text-sm font-medium text-slate-300 transition hover:text-white">
                  Platform
                </a>
                <a href="#features" className="text-sm font-medium text-slate-300 transition hover:text-white">
                  Features
                </a>
                <a href="#reviews" className="text-sm font-medium text-slate-300 transition hover:text-white">
                  Reviews
                </a>
                <a href="#comparison" className="text-sm font-medium text-slate-300 transition hover:text-white">
                  Why Us
                </a>
              </nav>

              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-gradient-to-r from-sky-400 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_-12px_rgba(99,102,241,0.55)] transition hover:-translate-y-0.5"
                >
                  Open CRM
                </Link>
              </div>
            </div>
          </motion.header>

          <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
            className="grid gap-14 pt-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:pt-20"
          >
            <motion.div variants={fadeUp}>
              <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-sky-200 shadow-sm">
                Future-ready CRM
              </div>

              <h1 className="mt-6 max-w-4xl text-[42px] font-semibold leading-[0.96] tracking-[-0.05em] text-white sm:text-[58px] lg:text-[74px]">
                Ultra-Premium CRM for
                <br />
                Education and Migration
                <br />
                Teams
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Run leads, clients, applications, intake, imports, tasks, workflows, and branch operations from one premium platform with a high-trust modern experience.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-20px_rgba(99,102,241,0.5)] transition hover:-translate-y-0.5"
                >
                  Book Demo
                </Link>
                <Link
                  href="#platform"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
                >
                  View Platform
                </Link>
              </div>

              <motion.div variants={stagger} className="mt-10 grid gap-4 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <GlowCard key={item.title} className="p-5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)] backdrop-blur">
                    <p className="text-lg font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-sm font-medium text-slate-200">{item.title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{item.description}</p>
                  </GlowCard>
                ))}
              </motion.div>
            </motion.div>

            <motion.div variants={fadeUp} className="relative">
              <div className="absolute -inset-8 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.28),transparent_38%)] blur-3xl" />
              <div className="absolute -inset-2 rounded-[36px] bg-gradient-to-br from-sky-400/20 via-indigo-400/10 to-cyan-300/10 blur-2xl" />

              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-0.5, 0.5, -0.5] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.04] p-3 shadow-[0_40px_100px_-32px_rgba(0,0,0,0.7)] backdrop-blur"
              >
                <div className="absolute -inset-px rounded-[34px] bg-gradient-to-r from-sky-400/25 via-indigo-400/15 to-cyan-300/25 opacity-70 blur-md" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(56,189,248,0.12),transparent_28%)]" />
                <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#091325]">
                  <Image
                    src="/home/dashboard-overview.png"
                    alt="CRM Dynamic dashboard preview"
                    width={1600}
                    height={980}
                    className="h-auto w-full object-cover"
                    priority
                    unoptimized
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.section>
        </div>
      </div>

      <motion.section
        id="reviews"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="border-y border-white/10 bg-white/[0.03]"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div variants={fadeUp} className="max-w-2xl">
            <DarkEyebrow>Client feedback</DarkEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Trusted by teams that want cleaner operations
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              These are sample testimonial placeholders for demo design. Replace them with your real reviews later.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="mt-10 grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <GlowCard key={item.name} className="p-6 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.45)]">
                <div className="mb-5 flex gap-1 text-sky-300">
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                  <span>★</span>
                </div>
                <p className="text-sm leading-7 text-slate-200">“{item.quote}”</p>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.role}</p>
                </div>
              </GlowCard>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        id="platform"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
        variants={stagger}
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <motion.div variants={fadeUp} className="max-w-2xl">
          <DarkEyebrow>Platform showcase</DarkEyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Show the product, not just the promise
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            Your product already looks strong internally. This homepage layout puts the real platform at the center of the story.
          </p>
        </motion.div>

        <motion.div variants={stagger} className="mt-12 space-y-8">
          {platformScreens.map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className={`group relative grid gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.04] p-5 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)] backdrop-blur lg:grid-cols-2 lg:items-center lg:p-6 ${
                item.reverse ? "lg:[&>div:first-child]:order-2 lg:[&>div:last-child]:order-1" : ""
              }`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_35%)] opacity-0 transition duration-500 group-hover:opacity-100" />

              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0a1323]">
                <Image
                  src={item.image}
                  alt={item.alt}
                  width={1600}
                  height={980}
                  className="h-auto w-full object-cover transition duration-700 group-hover:scale-[1.02]"
                  unoptimized
                />
              </div>

              <div className="relative px-2 py-2 lg:px-6">
                <DarkEyebrow>{item.eyebrow}</DarkEyebrow>
                <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  {item.description}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200">
                    Premium UI
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200">
                    Responsive layout
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-200">
                    Workflow-ready
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        id="features"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="bg-[#f8fafc] text-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div variants={fadeUp} className="max-w-2xl">
            <LightEyebrow>Core features</LightEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Everything needed to run modern operations
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              From intake and check-in to imports, tasks, and applications, CRM Dynamic helps your team work from one clear system.
            </p>
          </motion.div>

          <motion.div variants={stagger} className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.14)]"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.1),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(129,140,248,0.1),transparent_35%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                <div className="relative">
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="bg-white text-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div variants={fadeUp}>
              <LightEyebrow>Office presence</LightEyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                A premium business presence for a premium product
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-600">
                These three office visuals help the homepage feel more trusted, premium, and established.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                  Reception interior
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                  Meeting room
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                  Open workspace
                </span>
              </div>
            </motion.div>

            <motion.div variants={stagger} className="grid gap-4 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {officePhotos.map((photo) => (
                <motion.div
                  key={photo.src}
                  variants={fadeUp}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.16)]"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={1400}
                    height={900}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    unoptimized
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        id="comparison"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="bg-[#f8fafc] text-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div variants={fadeUp} className="max-w-2xl">
            <LightEyebrow>Why CRM Dynamic</LightEyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              A smarter alternative to disconnected operations
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Use this section to show exactly why your platform is a better fit for education and migration businesses.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_20px_60px_-32px_rgba(15,23,42,0.18)]">
            <div className="grid grid-cols-1 border-b border-slate-200 bg-slate-950 text-white md:grid-cols-2">
              <div className="px-6 py-5 text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">
                Traditional tools
              </div>
              <div className="px-6 py-5 text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
                CRM Dynamic
              </div>
            </div>

            {comparisonRows.map((row) => (
              <div key={row.other} className="grid border-b border-slate-200 last:border-b-0 md:grid-cols-2">
                <div className="px-6 py-5 text-sm leading-7 text-slate-600">{row.other}</div>
                <div className="bg-sky-50/60 px-6 py-5 text-sm font-medium leading-7 text-slate-900">
                  {row.dynamic}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="relative overflow-hidden bg-slate-950 text-white"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.14),transparent_24%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <motion.div variants={fadeUp}>
              <DarkEyebrow>Complete module stack</DarkEyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                One homepage. One platform. One clear message.
              </h2>
              <p className="mt-5 text-base leading-8 text-slate-300">
                This section reinforces that CRM Dynamic is not just a dashboard. It is a full operational command layer for education and migration teams, wrapped in a premium visual experience with motion, glow, depth, and high-trust presentation.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                >
                  Access Platform
                </Link>
                <Link
                  href="/check-in"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  Try Check-In
                </Link>
              </div>
            </motion.div>

            <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-2">
              {modules.map((item) => (
                <motion.div
                  key={item}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="rounded-[22px] border border-white/10 bg-white/[0.05] px-5 py-4 text-sm font-medium text-slate-100 transition duration-300 hover:bg-white/[0.08]"
                >
                  {item}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={stagger}
        className="bg-white text-slate-900"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div variants={fadeUp} className="rounded-[34px] border border-slate-200 bg-slate-950 p-8 text-white shadow-[0_24px_70px_-30px_rgba(15,23,42,0.45)] sm:p-10 lg:p-12">
            <div className="max-w-3xl">
              <DarkEyebrow>Final CTA</DarkEyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Ready to present CRM Dynamic like a premium platform?
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Replace the old homepage with this new version, keep the logo and images in your public home folder, and you will instantly have a more modern and premium first impression.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5"
              >
                Book Demo
              </Link>
              <Link
                href="#platform"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                View Platform
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.section>
    </main>
  );
}
