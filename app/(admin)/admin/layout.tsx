"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  TicketPercent,
  UtensilsCrossed,
  Layers,
  UsersRound,
} from "lucide-react";
import LogoMark from "@/components/LogoMark";
import { ConfirmProvider } from "@/components/ui/confirm";
import { ToastProvider } from "@/components/ui/toast";
import { adminLogout, getStats, getToken } from "@/lib/admin-api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/club", label: "Club members", icon: UsersRound },
  { href: "/admin/content", label: "Site content", icon: Images },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isLogin = pathname === "/admin/login";
  const [ready, setReady] = useState(false);
  // live counts on the sidebar: the per-page chimes only help while that page
  // is open — these follow staff to every admin screen
  // phones: the 224px sidebar was always fixed on screen, forcing every admin
  // page into horizontal scroll — below md it becomes a drawer
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => setNavOpen(false), [pathname]);

  const statsQuery = useQuery({
    queryKey: ["admin", "stats", "navigation"],
    queryFn: getStats,
    enabled: !isLogin && ready,
    refetchInterval: 30_000,
  });
  const counts = {
    orders: statsQuery.data?.active_orders ?? 0,
    bookings: statsQuery.data?.pending_bookings ?? 0,
  };
  const logoutMutation = useMutation({
    mutationFn: adminLogout,
    onSettled: () => {
      queryClient.clear();
      router.replace("/admin/login");
    },
  });

  useEffect(() => {
    if (!isLogin && !getToken()) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  }, [isLogin, pathname, router]);

  if (isLogin) {
    return <ToastProvider>{children}</ToastProvider>;
  }
  if (!ready) {
    return (
      <div className="flex min-h-screen bg-white">
        <aside className="hidden md:flex w-64 flex-col bg-[#211a14] p-4 space-y-4">
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="h-6 w-6 rounded-full bg-white/20" />
            <div className="h-4 w-28 bg-white/20 rounded" />
          </div>
          <div className="space-y-2 pt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-9 w-full rounded-xl bg-white/10" />
            ))}
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
          <div className="h-28 rounded-xl bg-amber-500/10 border border-zinc-200" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-white border border-zinc-200"
              />
            ))}
          </div>
          <div className="h-80 rounded-xl bg-white border border-zinc-200" />
        </main>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="flex min-h-screen bg-[#faf8f5]">
          {/* phone top bar */}
          <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between bg-sidebar/95 backdrop-blur-md px-4 text-white border-b border-white/10 md:hidden">
            <div className="flex items-center gap-2.5">
              <button
                aria-label="Open navigation"
                aria-expanded={navOpen}
                className="-ml-1.5 rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                onClick={() => setNavOpen(true)}
              >
                <MenuIcon className="h-5 w-5" />
              </button>
              <span className="flex items-center gap-2 text-sm font-bold">
                <LogoMark size={20} />
                <span>Pancake Club</span>
                <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                  admin
                </span>
              </span>
            </div>
          </header>

          {/* mobile drawer backdrop */}
          {navOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity md:hidden"
              onClick={() => setNavOpen(false)}
              aria-hidden="true"
            />
          )}

          {/* sidebar (fixed drawer on mobile, static column on desktop) */}
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] flex-col bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-250 ease-out md:z-20 md:w-64 md:shadow-none md:translate-x-0",
              navOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {/* sidebar brand & close button header */}
            <div className="flex h-14 md:h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <LogoMark size={22} />
                <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                  Pancake Club
                </span>
                <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                  admin
                </span>
              </div>
              <button
                aria-label="Close navigation"
                className="rounded-lg p-1.5 text-white/70 hover:bg-white/10 hover:text-white transition-colors md:hidden -mr-1"
                onClick={() => setNavOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* nav links */}
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-3">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                    pathname === href
                      ? "bg-amber-500/15 text-amber-300 shadow-xs border border-amber-500/20 font-bold"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{label}</span>
                  {href === "/admin/orders" && counts.orders > 0 && (
                    <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-black shadow-xs">
                      {counts.orders}
                    </span>
                  )}
                  {href === "/admin/bookings" && counts.bookings > 0 && (
                    <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-black shadow-xs">
                      {counts.bookings}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            {/* sidebar bottom footer actions */}
            <div className="flex flex-col gap-1 border-t border-white/10 px-3 py-3">
              <a
                href="/"
                target="_blank"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ExternalLink className="h-4 w-4 shrink-0" />
                <span className="truncate">View site</span>
              </a>
              <button
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className={cn("h-4 w-4 shrink-0", logoutMutation.isPending && "animate-pulse")} />
                <span className="truncate">{logoutMutation.isPending ? "Logging out…" : "Log out"}</span>
              </button>
            </div>
          </aside>

          {/* min-w-0: as a flex item, main's default min-width:auto let wide tables
              set the page width instead of scrolling inside their own wrapper */}
          <main className="min-w-0 flex-1 bg-white p-4 pt-18 sm:p-5 md:ml-64 md:p-6 lg:p-8 md:pt-6 lg:pt-8">
            {children}
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  );
}
