"use client";

// Friendly fallback shown if a storefront page throws while rendering, instead
// of a raw crash. Most data fetches already fall back to cached content, so this
// is a last resort.
import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to the browser console / monitoring; the digest links to server logs.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-bold">Something went wrong 🥞</h1>
      <p className="text-muted-foreground">
        We hit a snag loading this page. Please try again — if it keeps happening, give us a call.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-foreground px-6 py-2 font-semibold text-background"
        >
          Try again
        </button>
        <Link href="/" className="rounded-full border px-6 py-2 font-semibold">
          Back home
        </Link>
      </div>
    </main>
  );
}
