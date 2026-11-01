"use client";

export default function BackendUnavailable({
  onRetry,
}: {
  onRetry?: () => void;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-red-50 px-6 py-12">
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-red-200/60 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-96 w-96 rounded-full bg-rose-200/70 blur-3xl" />
      <section className="relative w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl shadow-red-900/10 sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-700 text-3xl font-black text-white shadow-lg shadow-red-700/20">
          d
        </div>
        <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-red-600">
          Service unavailable
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-red-950">
          We can&apos;t reach the backend
        </h1>
        <p className="mx-auto mt-4 max-w-sm leading-7 text-zinc-500">
          Please make sure the backend is running, then try again.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-red-700 px-5 text-sm font-semibold text-white transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-200"
          >
            Try again
          </button>
        )}
      </section>
    </main>
  );
}
