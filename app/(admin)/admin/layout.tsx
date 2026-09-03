"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarCheck,
  Menu as MenuIcon,
  X,
  ExternalLink,
  Images,
  LayoutDashboard,
  LogOut,
  Settings,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { ConfirmProvider } from "@/components/ui/confirm";
import { ToastProvider } from "@/components/ui/toast";
import { clearToken, getStats, getToken } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/content", label: "Site content", icon: Images },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);
  // live counts on the sidebar: the per-page chimes only help while that page
  // is open — these follow staff to every admin screen
  const [counts, setCounts] = useState<{ orders: number; bookings: number }>({ orders: 0, bookings: 0 });
  // phones: the 224px sidebar was always fixed on screen, forcing every admin
  // page into horizontal scroll — below md it becomes a drawer
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => setNavOpen(false), [pathname]);

  useEffect(() => {
    if (isLogin || !ready) return;
    let stop = false;
    const tick = () =>
      getStats()
        .then((st) => { if (!stop) setCounts({ orders: st.active_orders, bookings: st.pending_bookings }); })
        .catch(() => {});
    tick();
    const id = setInterval(tick, 30_000);
    return () => { stop = true; clearInterval(id); };
  }, [isLogin, ready, pathname]);

  useEffect(() => {
    if (!isLogin && !getToken()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  if (isLogin) return <ToastProvider>{children}</ToastProvider>;
  if (!ready) {
    return (
      <div className="flex min-h-screen bg-[#faf5ee]">
        <aside className="hidden md:flex w-56 flex-col bg-[#211a14] p-4 space-y-4">
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="h-6 w-6 rounded-full bg-white/20 animate-pulse" />
            <div className="h-4 w-28 bg-white/20 rounded animate-pulse" />
          </div>
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-9 w-full rounded-xl bg-white/10 animate-pulse" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          <div className="h-28 rounded-3xl bg-amber-500/10 border-2 border-[#eee3d5] animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 rounded-3xl bg-white border-2 border-[#eee3d5] animate-pulse" />
            ))}
          </div>
          <div className="h-80 rounded-3xl bg-white border-2 border-[#eee3d5] animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <ToastProvider>
    <ConfirmProvider>
    <div className="flex min-h-screen">
      {/* phone top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 bg-sidebar px-4 text-white md:hidden">
        <button aria-label="Open navigation" aria-expanded={navOpen} className="-ml-2 p-2" onClick={() => setNavOpen(true)}>
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2 text-sm font-bold"><LogoMark size={18} /> Pancake Club admin</span>
      </header>
      {navOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setNavOpen(false)} aria-hidden="true" />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-56 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 md:z-20 md:translate-x-0",
          navOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          aria-label="Close navigation"
          className="absolute right-1.5 top-2.5 p-2 text-white/70 hover:text-white md:hidden"
          onClick={() => setNavOpen(false)}
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex h-14 items-center gap-2 px-5 pr-12 text-lg font-bold tracking-tight md:pr-5">
          <LogoMark size={22} /> Pancake Club <span className="text-xs font-medium opacity-60">admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === href
                  ? "bg-white/15 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {href === "/admin/orders" && counts.orders > 0 && (
                <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-black">
                  {counts.orders}
                </span>
              )}
              {href === "/admin/bookings" && counts.bookings > 0 && (
                <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-black">
                  {counts.bookings}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-1 px-3 pb-4">
          <a
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="h-4 w-4" />
            View site
          </a>
          <button
            onClick={() => {
              clearToken();
              router.replace("/admin/login");
            }}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>
      {/* min-w-0: as a flex item, main's default min-width:auto let wide tables
          set the page width instead of scrolling inside their own wrapper */}
      <main className="min-w-0 flex-1 bg-muted/40 p-4 pt-16 md:ml-56 md:p-8 md:pt-8">{children}</main>
    </div>
    </ConfirmProvider>
    </ToastProvider>
  );
}
