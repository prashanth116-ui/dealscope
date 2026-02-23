import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
}

export function MetricCard({ label, value, subtitle, color }: MetricCardProps) {
  return (
    <div className="rounded-lg border bg-white p-3 min-w-[120px]">
      <div className="text-[10px] text-muted-foreground mb-1">{label}</div>
      <div className={cn("text-lg font-bold", color ? "" : "text-primary")} style={color ? { color } : undefined}>
        {value}
      </div>
      {subtitle && <div className="text-[10px] text-muted-foreground">{subtitle}</div>}
    </div>
  );
}
