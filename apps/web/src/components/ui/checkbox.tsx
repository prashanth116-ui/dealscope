"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className={cn(
          "h-5 w-5 shrink-0 rounded border-2 border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          checked && "bg-primary text-primary-foreground",
          className
        )}
        onClick={() => onCheckedChange?.(!checked)}
      >
        {checked && <Check className="h-3.5 w-3.5 mx-auto" />}
        <input ref={ref} type="checkbox" className="sr-only" checked={checked} readOnly {...props} />
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
