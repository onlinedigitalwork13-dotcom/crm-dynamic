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
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

function getTypeStyle(type: string) {
  switch (type) {
    case "client_assigned":
      return "bg-blue-50 border-blue-200";
    case "lead_assigned":
      return "bg-indigo-50 border-indigo-200";
    case "task_assigned":
      return "bg-violet-50 border-violet-200";
    case "task_due":
      return "bg-amber-50 border-amber-200";
    case "task_completed":
      return "bg-emerald-50 border-emerald-200";
    default:
      return "bg-slate-50 border-slate-200";
  }
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const hasNotifications = useMemo(
    () => notifications.length > 0,
    [notifications]
  );

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications", {
        cache: "no-store",
      });

      const data: NotificationsResponse = await res.json();

      if (!res.ok) throw new Error();

      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      console.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();

    // 🔁 polling every 20 sec
    const interval = setInterval(() => {
      void loadNotifications();
    }, 20000);

    return () => clearInterval(interval);
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

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markOneAsRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        )
      );

      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch {
      console.error("Failed to mark read");
    }
  }

  async function markAllAsRead() {
    try {
      setMarkingAll(true);

      await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );

      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm hover:bg-slate-50"
      >
        <BellIcon />

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[400px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
          
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold">Notifications</h3>
              <p className="text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            <button
              onClick={() => void markAllAsRead()}
              disabled={markingAll || unreadCount === 0}
              className="text-xs text-blue-600 disabled:text-slate-400"
            >
              {markingAll ? "Marking..." : "Mark all read"}
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-3 space-y-2">
            {loading ? (
              <div className="p-4 text-sm">Loading...</div>
            ) : !hasNotifications ? (
              <div className="p-4 text-sm text-slate-500">
                No notifications yet.
              </div>
            ) : (
              notifications.map((item) => {
                const content = (
                  <div
                    className={`rounded-2xl border p-4 ${
                      item.isRead
                        ? "bg-white"
                        : getTypeStyle(item.type)
                    }`}
                  >
                    <p className="text-sm font-semibold">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-600 mt-1">
                      {item.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      {formatTime(item.createdAt)}
                    </p>
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
                  >
                    {content}
                  </Link>
                ) : (
                  <div key={item.id}>{content}</div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}