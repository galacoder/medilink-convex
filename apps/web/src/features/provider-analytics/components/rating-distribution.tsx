"use client";

/**
 * Rating distribution component — bar chart showing count per star level.
 *
 * WHY: Hospitals want a quick visual summary of how well a provider is rated
 * across all completed services. The distribution helps identify patterns
 * (mostly 5-star, or spread) that overall average hides.
 *
 * vi: "Phân phối đánh giá" / en: "Rating distribution chart"
 */
import { StarIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";

import type { RatingDistributionEntry, RecentReview } from "../types";
import { analyticsLabels } from "../labels";

interface RatingDistributionProps {
  averageRating: number;
  totalRatings: number;
  distribution: RatingDistributionEntry[];
  recentReviews: RecentReview[];
  isLoading: boolean;
}

/**
 * Renders star icons (filled/empty) for a rating value.
 */
function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <StarIcon
          key={i}
          className={`h-3 w-3 ${
            i < Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Displays rating distribution and recent reviews.
 */
export function RatingDistribution({
  averageRating,
  totalRatings,
  distribution,
  recentReviews,
  isLoading,
}: RatingDistributionProps) {
  const labels = analyticsLabels.ratings;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="bg-muted h-5 w-32 animate-pulse rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-muted h-4 animate-pulse rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {/* vi: "Đánh giá từ bệnh viện" / en: "Hospital Ratings" */}
          {labels.title.vi}
        </CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">
              {averageRating.toFixed(1)}
            </span>
            <StarRating rating={averageRating} />
            <span className="text-muted-foreground text-sm">
              ({totalRatings} {labels.totalRatings.vi})
            </span>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Distribution bars (5 → 1 star, high to low) */}
        <div className="space-y-1.5" data-testid="rating-distribution">
          {[5, 4, 3, 2, 1].map((star) => {
            const entry = distribution.find((d) => d.stars === star) ?? {
              stars: star,
              count: 0,
            };
            const widthPct = Math.round((entry.count / maxCount) * 100);
            return (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-right text-xs">{star}</span>
                <StarIcon className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <div className="bg-muted flex-1 rounded-full">
                  <div
                    className="h-2 rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                <span className="text-muted-foreground w-4 text-right text-xs">
                  {entry.count}
                </span>
              </div>
            );
          })}
        </div>

        {/* Recent reviews */}
        {recentReviews.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">
              {/* vi: "Đánh giá gần đây" / en: "Recent Reviews" */}
              {labels.recentReviews.vi}
            </h4>
            <div className="space-y-3">
              {recentReviews.slice(0, 3).map((review) => (
                <div key={review._id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <StarRating rating={review.rating} />
                    <span className="text-muted-foreground text-xs">
                      {review.hospitalName}
                    </span>
                  </div>
                  {review.commentVi && (
                    <p className="text-muted-foreground text-xs">
                      {review.commentVi}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {totalRatings === 0 && (
          <p className="text-muted-foreground text-center text-sm">
            {/* vi: "Chưa có đánh giá" / en: "No ratings yet" */}
            {labels.noRatings.vi}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
