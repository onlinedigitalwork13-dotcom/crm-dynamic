import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getUnreadNotificationCount,
  getUserNotifications,
} from "@/lib/notification-service";

type NotificationsPageProps = {
  searchParams?: Promise<{
    page?: string;
    unreadOnly?: string;
  }>;
};

function formatTime(value: Date | string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function getTypeStyle(type: string, isRead: boolean) {
  if (isRead) {
    return {
      card: "border-white/60 bg-white/70",
      badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      accent: "bg-slate-300",
      dot: "bg-slate-300",
    };
  }

  switch (type) {
    case "lead_created":
      return {
        card: "border-blue-200/80 bg-gradient-to-br from-blue-50 to-white",
        badge: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
        accent: "bg-blue-500",
        dot: "bg-blue-500",
      };
    case "lead_assigned":
      return {
        card: "border-indigo-200/80 bg-gradient-to-br from-indigo-50 to-white",
        badge: "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
        accent: "bg-indigo-500",
        dot: "bg-indigo-500",
      };
    case "task_created":
      return {
        card: "border-slate-200/80 bg-gradient-to-br from-slate-50 to-white",
        badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        accent: "bg-slate-500",
        dot: "bg-slate-500",
      };
    case "task_assigned":
      return {
        card: "border-violet-200/80 bg-gradient-to-br from-violet-50 to-white",
        badge: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
        accent: "bg-violet-500",
        dot: "bg-violet-500",
      };
    case "task_completed":
      return {
        card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-white",
        badge: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
        accent: "bg-emerald-500",
        dot: "bg-emerald-500",
      };
    case "task_due":
      return {
        card: "border-amber-200/80 bg-gradient-to-br from-amber-50 to-white",
        badge: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
        accent: "bg-amber-500",
        dot: "bg-amber-500",
      };
    case "client_assigned":
      return {
        card: "border-cyan-200/80 bg-gradient-to-br from-cyan-50 to-white",
        badge: "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200",
        accent: "bg-cyan-500",
        dot: "bg-cyan-500",
      };
    case "client_stage_changed":
      return {
        card: "border-orange-200/80 bg-gradient-to-br from-orange-50 to-white",
        badge: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
        accent: "bg-orange-500",
        dot: "bg-orange-500",
      };
    default:
      return {
        card: "border-slate-200/80 bg-gradient-to-br from-slate-50 to-white",
        badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        accent: "bg-slate-500",
        dot: "bg-slate-500",
      };
  }
}

function formatType(type: string) {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default async function NotificationsPage({
  searchParams,
}: NotificationsPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const resolvedSearchParams = (await searchParams) ?? {};
  const page = Math.max(Number(resolvedSearchParams.page || "1") || 1, 1);
  const unreadOnly = resolvedSearchParams.unreadOnly === "true";

  const [{ notifications, pagination }, unreadCount] = await Promise.all([
    getUserNotifications(session.user.id, {
      page,
      limit: 20,
      unreadOnly,
    }),
    getUnreadNotificationCount(session.user.id),
  ]);

  const totalCount = pagination.total;
  const readCount = Math.max(totalCount - unreadCount, 0);

  function buildPageLink(nextPage: number, nextUnreadOnly = unreadOnly) {
    const params = new URLSearchParams();
    params.set("page", String(nextPage));
    if (nextUnreadOnly) {
      params.set("unreadOnly", "true");
    }
    return `/notifications?${params.toString()}`;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/60 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(248,250,252,0.92)_40%,rgba(241,245,249,0.88)_100%)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.07),transparent_25%)]" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
              Notification Center
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Stay on top of every update
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              Review lead intake activity, task changes, reminders, and workflow
              alerts in one premium workspace designed for faster operations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Alerts
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                {totalCount}
              </p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Unread
              </p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-2xl font-bold tracking-tight text-slate-950">
                  {unreadCount}
                </p>
                {unreadCount > 0 ? (
                  <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Read
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                {readCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/60 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="flex flex-col gap-4 border-b border-slate-200/80 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Inbox
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Filter and review alerts across leads, tasks, and client workflows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={buildPageLink(1, false)}
              className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                !unreadOnly
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              All Notifications
            </Link>

            <Link
              href={buildPageLink(1, true)}
              className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                unreadOnly
                  ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Unread Only
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {notifications.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-2xl shadow-inner">
                ◈
              </div>
              <h3 className="mt-5 text-lg font-semibold text-slate-950">
                No notifications found
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {unreadOnly
                  ? "You do not have any unread alerts right now."
                  : "New lead, task, and workflow notifications will appear here as your team works."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((item) => {
                const styles = getTypeStyle(item.type, item.isRead);

                const card = (
                  <div
                    className={`group relative overflow-hidden rounded-[24px] border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)] sm:p-6 ${styles.card}`}
                  >
                    <div className="absolute inset-y-0 left-0 w-1.5 rounded-l-[24px] ${styles.accent}" />
                    <div
                      className={`absolute left-0 top-0 h-full w-1.5 rounded-l-[24px] ${styles.accent}`}
                    />

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {!item.isRead ? (
                            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                          ) : (
                            <span className={`inline-flex h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                          )}

                          <h3 className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
                            {item.title}
                          </h3>

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles.badge}`}
                          >
                            {formatType(item.type)}
                          </span>

                          {!item.isRead ? (
                            <span className="inline-flex rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                              Unread
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-3 text-sm leading-7 text-slate-700">
                          {item.message}
                        </p>

                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                          <span>{formatTime(item.createdAt)}</span>
                          {item.link ? (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              Linked action
                              <span aria-hidden="true">↗</span>
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {item.link ? (
                        <div className="shrink-0">
                          <span className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition group-hover:bg-slate-50">
                            Open
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );

                return item.link ? (
                  <Link key={item.id} href={item.link}>
                    {card}
                  </Link>
                ) : (
                  <div key={item.id}>{card}</div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-200/80 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            Showing page <span className="font-semibold text-slate-900">{pagination.page}</span> of{" "}
            <span className="font-semibold text-slate-900">{pagination.totalPages}</span>
          </div>

          <div className="flex flex-wrap gap-3">
            {pagination.hasPreviousPage ? (
              <Link
                href={buildPageLink(pagination.page - 1)}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Previous
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-400">
                Previous
              </span>
            )}

            {pagination.hasNextPage ? (
              <Link
                href={buildPageLink(pagination.page + 1)}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/15 transition hover:bg-slate-800"
              >
                Next
              </Link>
            ) : (
              <span className="inline-flex cursor-not-allowed items-center justify-center rounded-2xl bg-slate-300 px-4 py-2.5 text-sm font-semibold text-white">
                Next
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}