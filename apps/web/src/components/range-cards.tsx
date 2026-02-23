import { cn } from "@/lib/utils";
import { fmtCurrency, fmtPct } from "@/lib/utils";
import type { Range } from "@dealscope/core";

interface RangeCardsProps {
  label: string;
  range: Range;
  format?: "currency" | "percent";
}

export function RangeCards({ label, range, format = "currency" }: RangeCardsProps) {
  const fmt = format === "percent" ? fmtPct : fmtCurrency;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="rounded-lg bg-gray-50 p-3 text-center">
        <div className="text-[10px] text-muted-foreground mb-1">Low</div>
        <div className="text-sm font-bold text-destructive">{fmt(range.low)}</div>
      </div>
      <div className="rounded-lg bg-primary/5 border border-primary p-3 text-center">
        <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
        <div className="text-sm font-bold text-primary">{fmt(range.mid)}</div>
      </div>
      <div className="rounded-lg bg-gray-50 p-3 text-center">
        <div className="text-[10px] text-muted-foreground mb-1">High</div>
        <div className="text-sm font-bold text-success">{fmt(range.high)}</div>
      </div>
    </div>
  );
}
