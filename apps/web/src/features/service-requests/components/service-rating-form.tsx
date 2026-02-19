"use client";

/**
 * ServiceRatingForm component — 1-5 star rating with sub-dimensions.
 *
 * WHY: Hospital staff rate completed services to provide quality feedback
 * for providers. Sub-ratings (serviceQuality, timeliness, professionalism)
 * give more granular insights than a single overall score. Only shown when
 * the service request is completed and has no existing rating.
 *
 * Validation: minimum 1 star is required before submission.
 */
import { useState } from "react";

import { Button } from "@medilink/ui/button";

import { serviceRequestLabels } from "~/lib/i18n/service-request-labels";

interface RatingInput {
  rating: number;
  serviceQuality?: number;
  timeliness?: number;
  professionalism?: number;
  commentVi?: string;
}

interface ServiceRatingFormProps {
  onSubmit: (data: RatingInput) => Promise<void>;
}

const labels = serviceRequestLabels.rating;

/** Star button component */
function StarButton({
  filled,
  onClick,
  label,
}: {
  filled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={[
        "text-2xl transition-transform hover:scale-110 focus:outline-none",
        filled ? "text-yellow-400" : "text-muted-foreground/30",
      ].join(" ")}
    >
      ★
    </button>
  );
}

/** Sub-rating stars row */
function SubRating({
  label,
  dimension,
  value,
  onChange,
}: {
  label: string;
  dimension: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-muted-foreground min-w-0 flex-1">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${dimension} ${star}`}
            onClick={() => onChange(star)}
            className={[
              "text-lg transition-transform hover:scale-110 focus:outline-none",
              star <= value ? "text-yellow-400" : "text-muted-foreground/30",
            ].join(" ")}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export function ServiceRatingForm({ onSubmit }: ServiceRatingFormProps) {
  const [rating, setRating] = useState(0);
  const [serviceQuality, setServiceQuality] = useState(0);
  const [timeliness, setTimeliness] = useState(0);
  const [professionalism, setProfessionalism] = useState(0);
  const [commentVi, setCommentVi] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      setError(labels.validation.minStars.vi);
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        serviceQuality: serviceQuality || undefined,
        timeliness: timeliness || undefined,
        professionalism: professionalism || undefined,
        commentVi: commentVi || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall rating */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{labels.overall.vi}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <StarButton
              key={star}
              filled={star <= rating}
              onClick={() => setRating(star)}
              label={`${star} ${labels.stars.vi}`}
            />
          ))}
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </div>

      {/* Sub-ratings */}
      <div className="space-y-3">
        <SubRating
          label={labels.serviceQuality.vi}
          dimension="serviceQuality"
          value={serviceQuality}
          onChange={setServiceQuality}
        />
        <SubRating
          label={labels.timeliness.vi}
          dimension="timeliness"
          value={timeliness}
          onChange={setTimeliness}
        />
        <SubRating
          label={labels.professionalism.vi}
          dimension="professionalism"
          value={professionalism}
          onChange={setProfessionalism}
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label className="text-sm font-medium">{labels.comment.vi}</label>
        <textarea
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          placeholder={labels.commentPlaceholder.vi}
          value={commentVi}
          onChange={(e) => setCommentVi(e.target.value)}
        />
      </div>

      <Button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? labels.submitting.vi : labels.submit.vi}
      </Button>
    </div>
  );
}
