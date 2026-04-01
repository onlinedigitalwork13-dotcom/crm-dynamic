"use client";

import { Suspense, FormEvent, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.20),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.06),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,42,0.25),rgba(15,23,42,0.88))]" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/15 backdrop-blur">
              C
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight">CRM Dynamic</p>
              <p className="text-xs text-slate-300">
                Education & Migration CRM
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
            >
              Back to Home
            </Link>
          </div>
        </header>

        <div className="flex flex-1 items-center py-10">
          <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="order-2 lg:order-1">
              <div className="max-w-xl">
                <div className="inline-flex items-center rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">
                  Secure platform access
                </div>

                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  Premium CRM access for serious client operations.
                </h1>

                <p className="mt-5 text-base leading-8 text-slate-300 sm:text-lg">
                  Sign in to manage leads, clients, workflows, applications,
                  intake forms, staff coordination, and operational follow-up in
                  one structured platform.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Access
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Role-Based
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Secure sign-in with protected workflows and staff access.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Operations
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Unified
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Intake, pipeline, applications, and team execution in one place.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Experience
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      Responsive
                    </p>
                    <p className="mt-2 text-sm text-slate-300">
                      Built to feel sharp across desktop, tablet, and mobile.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const error = searchParams.get("error");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (result?.error) {
      router.push("/login?error=credentials");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.08] p-6 shadow-[0_30px_90px_-25px_rgba(15,23,42,0.75)] backdrop-blur-xl sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.14),transparent_30%)]" />

        <div className="relative">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
                Sign in
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
                Welcome back
              </h2>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-200">
              Secure
            </div>
          </div>

          <p className="text-sm leading-7 text-slate-300">
            Access your CRM workspace to manage clients, leads, workflows, and
            internal operations.
          </p>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
              Invalid email or password. Please try again.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-200"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 transition focus:border-blue-300/60 focus:bg-white/[0.14] focus:ring-4 focus:ring-blue-400/10"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-200"
                >
                  Password
                </label>
                <span className="text-xs text-slate-400">Protected access</span>
              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 transition focus:border-blue-300/60 focus:bg-white/[0.14] focus:ring-4 focus:ring-blue-400/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to CRM"}
            </button>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Workflow Ready
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Clients, tasks, applications, and intake connected in one system.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                Built for Teams
              </p>
              <p className="mt-2 text-sm text-slate-200">
                Structured access for branch operations and staff collaboration.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/"
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginPageFallback() {
  return (
    <LoginPageShell>
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-[32px] border border-white/10 bg-white/[0.08] p-8 shadow-[0_30px_90px_-25px_rgba(15,23,42,0.75)] backdrop-blur-xl">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-10 w-48 rounded bg-white/10" />
            <div className="h-4 w-full rounded bg-white/10" />
            <div className="h-14 w-full rounded-2xl bg-white/10" />
            <div className="h-14 w-full rounded-2xl bg-white/10" />
            <div className="h-12 w-full rounded-2xl bg-white/10" />
          </div>
        </div>
      </div>
    </LoginPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageShell>
        <LoginCard />
      </LoginPageShell>
    </Suspense>
  );
}