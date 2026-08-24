"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteReview, listReviews, updateReview, type AdminReview } from "@/lib/admin-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    listReviews()
      .then(setReviews)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const { toast } = useToast();

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Approved reviews appear in the carousel on the home page
        </p>
      </div>

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {reviews.map((r) => (
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
        ))}
        {reviews.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
