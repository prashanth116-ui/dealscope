"use client";

import type { DealStatus } from "@dealscope/api-client";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  id: string;
  address: string;
  units: number;
  askingPrice: number;
  capRate: number;
  cashOnCash: number;
  monthlyCashFlow: number;
  status: DealStatus;
  createdAt: string;
  onPress: () => void;
  onDelete: () => void;
}

const STATUS_VARIANT: Record<DealStatus, "default" | "warning" | "success" | "secondary"> = {
  Analyzing: "default",
  Offered: "warning",
  "Under Contract": "success",
  Closed: "success",
  Passed: "secondary",
};

export function AnalysisCard({
  address,
  units,
  askingPrice,
  capRate,
  cashOnCash,
  monthlyCashFlow,
  status,
  createdAt,
  onPress,
  onDelete,
}: Props) {
  const dateStr = new Date(createdAt).toLocaleDateString();

  return (
    <div
      className="rounded-xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onPress}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-primary truncate flex-1 mr-2">{address}</h3>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[status]}>{status}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex justify-between mb-3 text-xs text-muted-foreground">
        <span>{units} units | ${Math.round(askingPrice).toLocaleString()}</span>
        <span>{dateStr}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">Cap Rate</div>
          <div className="text-sm font-bold text-primary">{capRate.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">CoC</div>
          <div className="text-sm font-bold text-primary">{cashOnCash.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">Monthly CF</div>
          <div className={`text-sm font-bold ${monthlyCashFlow >= 0 ? "text-success" : "text-destructive"}`}>
            ${Math.round(monthlyCashFlow).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
