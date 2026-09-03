"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageSquareHeart,
  Star,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  ThumbsUp,
  X,
  RefreshCw,
  Sparkles,
  Quote,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import {
  deleteReview,
  listReviews,
  updateReview,
  type AdminReview,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";

type ReviewFilter = "all" | "pending" | "public" | "5star";

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const { toast } = useToast();
  const { confirm: confirmDialog } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listReviews()
      .then((res) => {
        // Moderation queue first: unapproved on top, then newest first
        setReviews(
          [...res].sort((a, b) =>
            a.is_approved === b.is_approved
              ? b.created_at.localeCompare(a.created_at)
              : a.is_approved
              ? 1
              : -1
          )
        );
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load customer reviews"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (r: AdminReview, is_approved: boolean) => {
    const prev = reviews;
    setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, is_approved } : x)));
    try {
      await updateReview(r.id, { is_approved });
      toast({
        variant: "success",
        title: is_approved
          ? `✓ ${r.name}'s review is now public on the homepage!`
          : `Review from ${r.name} hidden from public view`,
      });
    } catch (e) {
      setReviews(prev);
      toast({
        variant: "error",
        title: "Update failed",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const remove = async (r: AdminReview) => {
    const ok = await confirmDialog({
      title: `Delete review from ${r.name}?`,
      description: "This review will be permanently removed from the website.",
      confirmLabel: "Delete Review",
      destructive: true,
    });
    if (!ok) return;
    const prev = reviews;
    setReviews((rs) => rs.filter((x) => x.id !== r.id));
    try {
      await deleteReview(r.id);
      toast({ variant: "success", title: "Review deleted successfully" });
    } catch (e) {
      setReviews(prev);
      toast({
        variant: "error",
        title: "Delete failed",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  // Filtered & Searched Reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.suburb && r.suburb.toLowerCase().includes(q)) ||
        r.quote.toLowerCase().includes(q);

      let matchesFilter = true;
      if (filter === "pending") matchesFilter = !r.is_approved;
      else if (filter === "public") matchesFilter = r.is_approved;
      else if (filter === "5star") matchesFilter = r.rating === 5;

      return matchesSearch && matchesFilter;
    });
  }, [reviews, searchQuery, filter]);

  // Statistics
  const totalCount = reviews.length;
  const pendingCount = reviews.filter((r) => !r.is_approved).length;
  const publicCount = reviews.filter((r) => r.is_approved).length;
  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;

  const averageRating = totalCount > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalCount).toFixed(1)
    : "5.0";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden p-6 sm:p-7 rounded-3xl bg-linear-to-r from-[#fffdf9] via-[#fcf6ee] to-[#faf0e1] border-2 border-[#eee3d5] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black bg-[#763a12] text-white uppercase tracking-wider shadow-2xs">
            <MessageSquareHeart className="h-3 w-3 text-amber-300" />
            CUSTOMER TESTIMONIALS &amp; FEEDBACK
          </div>
          <h1 className="text-2xl font-black text-[#211a14] tracking-tight">
            Guest Reviews &amp; Social Proof
          </h1>
          <p className="text-xs font-medium text-zinc-600 max-w-xl">
            Moderate incoming customer praise, customize avatar emojis, and choose which testimonials shine on the homepage carousel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            className="border-[#d9c7b4] text-[#763a12] bg-white hover:bg-[#faf5ee] text-xs font-bold rounded-2xl h-10 px-4"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 [&>*]:min-w-0">
        {/* Average Rating */}
        <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Average Rating</span>
            <div className="text-2xl font-black text-[#763a12] flex items-center gap-1.5">
              {loading ? (
                <Skeleton className="h-7 w-20 rounded-lg" />
              ) : (
                <>
                  <span>{averageRating}</span>
                  <span className="text-amber-500 text-lg">★★★★★</span>
                </>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-lg">
            ⭐
          </div>
        </div>

        {/* Pending Approval */}
        <div
          className={`p-4 rounded-2xl border-2 shadow-2xs flex items-center justify-between transition-all ${
            pendingCount > 0 ? "border-amber-300 bg-amber-50/80" : "border-[#eee3d5] bg-[#fffdf9]"
          }`}
        >
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Awaiting Review</span>
            <div className="text-2xl font-black text-amber-950 flex items-center gap-2">
              {loading ? (
                <Skeleton className="h-7 w-20 rounded-lg" />
              ) : (
                <>
                  {pendingCount} Pending
                  {pendingCount > 0 && (
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
                  )}
                </>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-lg">
            ⏳
          </div>
        </div>

        {/* Live on Public Site */}
        <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Live on Homepage</span>
            <div className="text-2xl font-black text-emerald-950">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${publicCount} Published`}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center font-bold text-lg">
            🌐
          </div>
        </div>

        {/* Total Feedback Count */}
        <div className="p-4 rounded-2xl border-2 border-[#eee3d5] bg-[#fffdf9] shadow-2xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Total Feedback</span>
            <div className="text-2xl font-black text-[#211a14]">
              {loading ? <Skeleton className="h-7 w-20 rounded-lg" /> : `${totalCount} Reviews`}
            </div>
          </div>
          <div className="h-10 w-10 rounded-xl bg-zinc-100 text-[#763a12] flex items-center justify-center font-bold text-lg">
            💬
          </div>
        </div>
      </div>

      {error && <AdminError message={error} onRetry={load} />}

      {/* ========================================================================= */}
      {/* SEARCH & STATUS FILTER BAR                                                */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#fffdf9] border-2 border-[#eee3d5] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              className="pl-10 h-11 text-xs font-bold border-[#d9c7b4] rounded-2xl bg-white text-[#211a14] placeholder:text-zinc-400"
              placeholder="Search reviews by guest name, suburb, or testimonial text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results Summary */}
          <div className="text-xs font-bold text-zinc-500 shrink-0">
            Showing <strong>{filteredReviews.length}</strong> of {reviews.length} testimonials
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#eee3d5]">
          {[
            { id: "all", label: "All Reviews", count: totalCount, icon: "💬" },
            { id: "pending", label: "Awaiting Moderation", count: pendingCount, icon: "⏳" },
            { id: "public", label: "Live on Website", count: publicCount, icon: "🌐" },
            { id: "5star", label: "5-Star Praise", count: fiveStarCount, icon: "⭐" },
          ].map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as ReviewFilter)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isSelected
                    ? "bg-[#763a12] text-white shadow-xs scale-[1.02]"
                    : "bg-white text-[#211a14] border border-[#d9c7b4] hover:bg-[#faf5ee]"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REVIEWS GRID                                                              */}
      {/* ========================================================================= */}
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 rounded-3xl bg-[#fffdf9] border-2 border-[#eee3d5] space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-36 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-16 w-full rounded-2xl" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-28 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </div>
          ))
        ) : filteredReviews.length === 0 ? (
          <div className="col-span-2 py-16 text-center space-y-3 bg-[#fffdf9] rounded-3xl border-2 border-[#eee3d5]">
            <div className="text-4xl">💬</div>
            <h3 className="text-base font-black text-[#211a14]">No reviews matched your filter</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Try adjusting your search keyword or switching between filter tabs.
            </p>
          </div>
        ) : (
          filteredReviews.map((r) => {
            const dateStr = new Date(r.created_at).toLocaleDateString("en-AU", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            return (
              <div
                key={r.id}
                className={`p-5 sm:p-6 rounded-3xl border-2 transition-all flex flex-col justify-between gap-4 ${
                  !r.is_approved
                    ? "bg-amber-50/50 border-amber-300 ring-2 ring-amber-300/30 shadow-xs"
                    : "bg-[#fffdf9] border-[#eee3d5] hover:border-[#d9c7b4] shadow-2xs"
                }`}
              >
                {/* Top Row: Reviewer Details & Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Emoji Avatar Input */}
                    <input
                      key={`av-${r.id}`}
                      defaultValue={r.avatar || "🥞"}
                      placeholder="🥞"
                      maxLength={4}
                      aria-label={`Emoji shown beside ${r.name}'s review`}
                      title="Custom emoji avatar — click to edit"
                      className="h-11 w-11 rounded-2xl border-2 border-[#ecdac7] bg-[#faf5ee] text-center text-xl leading-none shadow-2xs hover:border-[#763a12] transition-colors focus:ring-2 focus:ring-[#763a12]"
                      onBlur={async (e) => {
                        const v = e.target.value.trim();
                        if (v === r.avatar) return;
                        const prev = reviews;
                        setReviews((rs) => rs.map((x) => (x.id === r.id ? { ...x, avatar: v } : x)));
                        try {
                          await updateReview(r.id, { avatar: v });
                          toast({
                            variant: "success",
                            title: v ? `Avatar emoji updated for ${r.name}` : `Default avatar reset to 🥞`,
                          });
                        } catch (err) {
                          setReviews(prev);
                          toast({
                            variant: "error",
                            title: "Avatar update failed",
                            description: err instanceof Error ? err.message : undefined,
                          });
                        }
                      }}
                    />

                    <div>
                      <div className="font-black text-sm text-[#211a14] flex items-center gap-1.5">
                        <span>{r.name}</span>
                        {r.suburb && (
                          <span className="text-[11px] font-bold text-zinc-500">
                            · {r.suburb}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-amber-500 text-xs tracking-wider">
                          {"★".repeat(r.rating)}
                          <span className="text-zinc-300">{"★".repeat(5 - r.rating)}</span>
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400">
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Moderation Status Badge */}
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      r.is_approved
                        ? "bg-emerald-100 text-emerald-950 border border-emerald-300"
                        : "bg-amber-100 text-amber-950 border border-amber-300 animate-pulse"
                    }`}
                  >
                    {r.is_approved ? "✓ Public" : "⏳ Pending"}
                  </span>
                </div>

                {/* Quote Bubble */}
                <div className="p-3.5 rounded-2xl bg-[#faf5ee]/90 border border-[#ecdac7] text-xs font-medium text-[#211a14] relative">
                  <Quote className="h-3.5 w-3.5 text-[#763a12]/30 mb-1" />
                  <p className="italic leading-relaxed">
                    &ldquo;{r.quote}&rdquo;
                  </p>
                </div>

                {/* Bottom Row: Publish Switch & Delete */}
                <div className="flex items-center justify-between pt-2 border-t border-[#eee3d5]">
                  <label className="flex items-center gap-2 text-xs font-black text-[#211a14] cursor-pointer select-none">
                    <Switch
                      aria-label={`Publish review from ${r.name}`}
                      checked={r.is_approved}
                      onCheckedChange={(v) => approve(r, v)}
                    />
                    <span>{r.is_approved ? "Live on Homepage" : "Publish to Homepage"}</span>
                  </label>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => remove(r)}
                    aria-label={`Delete review from ${r.name}`}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-xl"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
