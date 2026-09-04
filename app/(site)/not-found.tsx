// Custom 404 for the storefront — reached by unknown URLs and by notFound()
// (e.g. an unknown /menu/[slug]). Keeps visitors on-brand instead of a bare page.
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you’re after has moved or never existed. Let’s get you back to the good stuff.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="rounded-full bg-foreground px-6 py-2 font-semibold text-background">
          Back home
        </Link>
        <Link href="/menu" className="rounded-full border px-6 py-2 font-semibold">
          See the menu
        </Link>
      </div>
    </main>
  );
}
