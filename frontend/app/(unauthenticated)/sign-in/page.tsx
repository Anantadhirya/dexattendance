"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type AuthMode = "sign-in" | "signup";

export default function SignInPage() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = Object.fromEntries(
      formData.entries(),
    );
    if (isSignIn) {
      payload.rememberMe = formData.get("remember") === "on";
      delete payload.remember;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

    try {
      const endpoint = mode === "sign-in" ? "login" : "signup";
      const response = await fetch(`${apiUrl}/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message.join(", ")
          : result.message;
        throw new Error(message ?? "Unable to authenticate");
      }

      router.push("/");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to authenticate",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSignIn = mode === "sign-in";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-red-50 px-6 py-12">
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-red-200/60 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-rose-200/70 blur-3xl" />

      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl shadow-red-900/10 lg:grid-cols-[1fr_1.15fr]">
        <div className="hidden flex-col justify-between bg-red-700 p-12 text-white lg:flex">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-xl font-black text-red-700">
                d
              </div>
              <span className="text-xl font-semibold tracking-tight">
                dexattendance
              </span>
            </div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-red-200">
              Attendance, simplified
            </p>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight">
              Make every workday count.
            </h1>
            <p className="mt-5 max-w-sm leading-7 text-red-100">
              Keep your team&apos;s attendance organized, accurate, and easy to
              manage.
            </p>
          </div>
          <p className="text-sm text-red-200">
            Simple tools for better workdays.
          </p>
        </div>

        <div className="p-7 sm:p-12">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-700 text-lg font-black text-white">
                d
              </div>
              <span className="text-xl font-semibold tracking-tight text-red-950">
                dexattendance
              </span>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {isSignIn ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              {isSignIn
                ? "Sign in to continue to your dashboard."
                : "Get started with dexattendance today."}
            </p>
          </div>

          <div className="mb-8 grid grid-cols-2 rounded-xl bg-red-50 p-1">
            <button
              type="button"
              onClick={() => switchMode("sign-in")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                isSignIn
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-red-400 hover:text-red-700"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                !isSignIn
                  ? "bg-white text-red-700 shadow-sm"
                  : "text-red-400 hover:text-red-700"
              }`}
            >
              Sign up
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!isSignIn && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-700">
                  Full name
                </span>
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">
                Email address
              </span>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">
                Password
              </span>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                autoComplete={isSignIn ? "current-password" : "new-password"}
                required
                className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
              />
            </label>

            {isSignIn && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-zinc-500">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-zinc-300 accent-red-700"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  className="font-semibold text-red-700 hover:text-red-800"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-xl bg-red-700 px-4 text-sm font-semibold text-white shadow-lg shadow-red-700/20 transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-200"
            >
              {isSubmitting
                ? "Please wait..."
                : isSignIn
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            {isSignIn ? "New to dexattendance?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => switchMode(isSignIn ? "signup" : "sign-in")}
              className="font-semibold text-red-700 hover:text-red-800"
            >
              {isSignIn ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
