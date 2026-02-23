"use client";

import { cn } from "@/lib/utils";

const STEP_LABELS = [
  "Property",
  "Rent Roll",
  "Expenses",
  "Financing",
  "Assumptions",
  "Results",
];

interface StepIndicatorProps {
  current: number;
  total?: number;
}

export function StepIndicator({ current, total = 6 }: StepIndicatorProps) {
  return (
    <div className="mb-6">
      {/* Progress bar */}
      <div className="flex gap-1 mb-2">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i + 1 <= current ? "bg-primary" : "bg-gray-200"
            )}
          />
        ))}
      </div>
      {/* Labels */}
      <div className="flex justify-between">
        {STEP_LABELS.map((label, i) => (
          <span
            key={label}
            className={cn(
              "text-[10px] font-medium",
              i + 1 === current ? "text-primary" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
