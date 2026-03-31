"use client";

type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  tone?: "default" | "success" | "warning";
};

type Props = {
  open: boolean;
  onClose: () => void;
};

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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

function toneClasses(tone?: ActivityItem["tone"]) {
  switch (tone) {
    case "success":
      return "bg-green-100 text-green-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function ActivityPanel({ open, onClose }: Props) {
  const items: ActivityItem[] = [
    {
      id: "1",
      title: "New user created",
      description: "A staff account was added to the CRM.",
      time: "Just now",
      tone: "success",
    },
    {
      id: "2",
      title: "Task due soon",
      description: "A follow-up task is approaching its due date.",
      time: "Today",
      tone: "warning",
    },
    {
      id: "3",
      title: "Application updated",
      description: "A recent application changed status.",
      time: "Today",
      tone: "default",
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[75]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close activity panel overlay"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 flex w-full justify-end">
        <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                <BellIcon />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
                <p className="text-sm text-gray-500">
                  Recent updates across the CRM
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
              aria-label="Close activity panel"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                <p className="text-sm font-medium text-gray-700">
                  No activity yet
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Recent notifications and updates will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {item.description}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses(
                          item.tone
                        )}`}
                      >
                        {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 px-5 py-4">
            <button
              type="button"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              View all activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}