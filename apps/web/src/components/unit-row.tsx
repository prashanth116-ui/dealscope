"use client";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import type { Unit, UnitStatus } from "@dealscope/core";

const STATUS_OPTIONS: { label: string; value: UnitStatus }[] = [
  { label: "Occupied", value: "occupied" },
  { label: "Vacant", value: "vacant" },
  { label: "Down", value: "down" },
];

interface UnitRowProps {
  unit: Unit;
  onChange: (updated: Unit) => void;
}

export function UnitRow({ unit, onChange }: UnitRowProps) {
  const set = (field: keyof Unit, value: string | number) => {
    onChange({ ...unit, [field]: value });
  };

  return (
    <div className="rounded-lg border bg-gray-50 p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-primary">Unit {unit.unitNumber}</span>
        <div className="flex gap-1">
          {STATUS_OPTIONS.map((s) => (
            <Button
              key={s.value}
              variant={unit.status === s.value ? "default" : "outline"}
              size="sm"
              className={cn("text-[10px] h-6 px-2 rounded-full")}
              onClick={() => set("status", s.value)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-muted-foreground">Beds</label>
          <Input
            type="number"
            className="h-8 text-sm"
            value={unit.beds || ""}
            onChange={(e) => set("beds", parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Baths</label>
          <Input
            type="number"
            className="h-8 text-sm"
            value={unit.baths || ""}
            onChange={(e) => set("baths", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Sqft</label>
          <Input
            type="number"
            className="h-8 text-sm"
            value={unit.sqft || ""}
            onChange={(e) => set("sqft", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-muted-foreground">Current Rent</label>
          <Input
            type="number"
            className="h-8 text-sm"
            placeholder="$0"
            value={unit.currentRent || ""}
            onChange={(e) => set("currentRent", parseFloat(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="text-[10px] text-muted-foreground">Market Rent</label>
          <Input
            type="number"
            className="h-8 text-sm"
            placeholder="$0"
            value={unit.marketRent || ""}
            onChange={(e) => set("marketRent", parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}
