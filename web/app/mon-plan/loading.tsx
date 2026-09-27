export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-5" aria-busy>
      <div className="h-7 w-48 rounded-lg bg-primary-tint animate-pulse" />
      <div className="mt-3 h-4 w-full rounded bg-primary-tint animate-pulse" />
      <div className="mt-6 h-10 w-64 rounded-pill bg-primary-tint animate-pulse" />
    </main>
  );
}
