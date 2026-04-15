"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  error?: string;
};

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

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function getTypeStyle(type: string, isRead: boolean) {
  if (isRead) {
    return "border-slate-200 bg-white";
  }

  switch (type) {
    case "client_assigned":
      return "border-blue-200 bg-blue-50/80";
    case "lead_assigned":
    case "lead_created":
      return "border-indigo-200 bg-indigo-50/80";
    case "task_assigned":
      return "border-violet-200 bg-violet-50/80";
    case "task_due":
      return "border-amber-200 bg-amber-50/80";
    case "task_completed":
      return "border-emerald-200 bg-emerald-50/80";
    default:
      return "border-slate-200 bg-slate-50/80";
  }
}

function getTypeLabel(type: string) {
  if (!type) return "Update";

  return type
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pollingRef = useRef(false);

  const hasNotifications = useMemo(
    () => notifications.length > 0,
    [notifications]
  );

  async function loadNotifications() {
    if (pollingRef.current) return;

    try {
      pollingRef.current = true;

      const res = await fetch("/api/notifications?limit=10", {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("Invalid response format");
      }

      const data: NotificationsResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load notifications");
      }

      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
      setUnreadCount(
        typeof data.unreadCount === "number" ? data.unreadCount : 0
      );
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Failed to load notifications"
      );
    } finally {
      setLoading(false);
      pollingRef.current = false;
    }
  }

  useEffect(() => {
    void loadNotifications();

    const interval = window.setInterval(() => {
      void loadNotifications();
    }, 20000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        e.target instanceof Node &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function markOneAsRead(id: string) {
    try {
      const target = notifications.find((n) => n.id === id);
      if (!target || target.isRead) return;

      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to mark read"
      );
    }
  }

  async function markAllAsRead() {
    try {
      setMarkingAll(true);

      const response = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(
        error instanceof Error ? error.message : "Failed to mark all read"
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        aria-label="Open notifications"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md"
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40 bg-black/10 lg:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed inset-x-3 top-20 z-50 max-h-[78vh] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl lg:absolute lg:right-0 lg:left-auto lg:top-auto lg:mt-3 lg:w-[92vw] lg:max-w-[430px] lg:inset-x-auto">
            <div className="border-b border-slate-200 bg-white/90 px-5 py-4 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-950">
                    Notifications
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {unreadCount} unread
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  disabled={markingAll || unreadCount === 0}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {markingAll ? "Marking..." : "Mark all read"}
                </button>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="h-4 w-40 rounded bg-slate-200" />
                      <div className="mt-3 h-3 w-full rounded bg-slate-200" />
                      <div className="mt-2 h-3 w-2/3 rounded bg-slate-200" />
                    </div>
                  ))}
                </div>
              ) : loadError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center">
                  <p className="text-sm font-semibold text-rose-700">
                    Could not load notifications
                  </p>
                  <p className="mt-1 text-sm text-rose-600">{loadError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      void loadNotifications();
                    }}
                    className="mt-4 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Retry
                  </button>
                </div>
              ) : !hasNotifications ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 shadow-sm">
                    <BellIcon />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-700">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    New lead, task, and workflow alerts will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((item) => {
                    const content = (
                      <div
                        className={`rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${getTypeStyle(
                          item.type,
                          item.isRead
                        )}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {item.title}
                              </p>
                              {!item.isRead ? (
                                <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-slate-950" />
                              ) : null}
                            </div>

                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                              {getTypeLabel(item.type)}
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {item.message}
                            </p>

                            <p className="mt-3 text-xs text-slate-400">
                              {formatTime(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );

                    return item.link ? (
                      <Link
                        key={item.id}
                        href={item.link}
                        onClick={() => {
                          if (!item.isRead) {
                            void markOneAsRead(item.id);
                          }
                          setOpen(false);
                        }}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (!item.isRead) {
                            void markOneAsRead(item.id);
                          }
                        }}
                        className="block w-full text-left"
                      >
                        {content}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                View all notifications
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}