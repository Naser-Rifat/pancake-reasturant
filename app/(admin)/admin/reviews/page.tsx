"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteReview, listReviews, updateReview, type AdminReview } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton, CardSkeleton } from "@/components/ui/skeleton";
import { AdminError } from "@/components/ui/admin-error";
import { useToast } from "@/components/ui/toast";

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listReviews()
      .then((res) => {
        setReviews(res);
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load reviews"))
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
        title: is_approved ? `${r.name}'s review is now public` : `${r.name}'s review hidden`,
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
    if (!confirm(`Delete the review from ${r.name}? This can't be undone.`)) return;
    const prev = reviews;
    setReviews((rs) => rs.filter((x) => x.id !== r.id));
    try {
      await deleteReview(r.id);
      toast({ variant: "success", title: "Review deleted" });
    } catch (e) {
      setReviews(prev);
      toast({
        variant: "error",
        title: "Delete failed",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            Approved reviews appear in the carousel on the home page
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      {error && <AdminError message={error} onRetry={load} />}

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="grid gap-3 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-28 rounded-full" />
                </div>
                <Skeleton className="h-16 w-full" />
                <div className="flex items-center justify-between pt-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          reviews.map((r) => (
            <Card key={r.id}>
              <CardContent className="grid gap-3 pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-medium">
                      {r.avatar} {r.name}
                      {r.suburb && <span className="text-muted-foreground"> · {r.suburb}</span>}
                    </div>
                    <div className="text-sm text-amber-500">
                      {"★".repeat(r.rating)}
                      <span className="text-muted-foreground">{"★".repeat(5 - r.rating)}</span>
                    </div>
                  </div>
                  <Badge variant={r.is_approved ? "success" : "warning"}>
                    {r.is_approved ? "public" : "awaiting approval"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">&ldquo;{r.quote}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Switch checked={r.is_approved} onCheckedChange={(v) => approve(r, v)} />
                    Show on website
                  </label>
                  <Button size="sm" variant="ghost" onClick={() => remove(r)} aria-label="Delete review">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        {!loading && reviews.length === 0 && !error && (
          <p className="text-sm text-muted-foreground py-6 col-span-2 text-center">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
