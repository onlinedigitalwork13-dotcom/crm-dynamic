import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ClipboardPlus,
  Sparkles,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import TaskCreateForm from "./task-create-form";

export default async function NewTaskPage() {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  });

  const clients = await prisma.client.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      passport: true,
    },
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_35%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_70%,_#f8fafc)]">
      <div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.22),transparent_30%),linear-gradient(135deg,#020617_0%,#0f172a_46%,#1e293b_100%)] px-6 py-8 text-white lg:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                  <Link href="/tasks" className="transition hover:text-white">
                    Tasks
                  </Link>
                  <span>/</span>
                  <span className="font-medium text-white">New</span>
                </div>

                <div className="mt-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/15">
                    <Sparkles className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
                      Task Workspace
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                      Add Task
                    </h1>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                      Create operational tasks, assign staff, link clients, and
                      manage deadlines in a premium workflow-ready experience.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 xl:w-[360px]">
                <div className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                    Task Setup
                  </p>
                  <p className="mt-1 text-sm text-white">
                    Assign work clearly, connect it to clients, and track
                    action items with stronger operational visibility.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-200" />
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                          Staff
                        </p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {users.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-slate-200" />
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                          Clients
                        </p>
                        <p className="mt-1 text-sm font-medium text-white">
                          {clients.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-slate-200" />
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">
                          Mode
                        </p>
                        <p className="mt-1 text-sm font-medium text-white">
                          Manual
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/tasks"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-sm font-medium text-white transition hover:bg-white/15"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TaskCreateForm users={users} clients={clients} />
      </div>
    </div>
  );
}