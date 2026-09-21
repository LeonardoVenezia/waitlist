"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = { sm: "size-4", md: "size-5", lg: "size-6", xl: "size-11" };

export function StarRating({ value, onChange, readonly = false, size = "md" }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const isInteractive = !readonly && !!onChange;

  return (
    <div
      role="group"
      aria-label="Rating"
      className={cn("flex items-center", size === "xl" ? "gap-1.5" : "gap-0.5")}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={!isInteractive}
            aria-label={`Rate ${star} out of 5`}
            className={cn(
              sizeMap[size],
              "rounded-md transition-[color,transform] duration-150",
              "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              isInteractive && "cursor-pointer hover:scale-110 active:scale-95",
            )}
            onMouseEnter={() => isInteractive && setHover(star)}
            onMouseLeave={() => isInteractive && setHover(0)}
            onClick={() => isInteractive && onChange?.(star)}
          >
            {/* ponytail: gold is the rating convention; it sits outside the warm
                palette on purpose, same as it does on every other product. */}
            <svg
              aria-hidden="true"
              className={cn(sizeMap[size], filled ? "text-yellow-400" : "text-border")}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
