"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AnalysisError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Analysis error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-bold text-primary">Analysis Error</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        {error.message || "Something went wrong with the analysis."}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
        <Button onClick={reset}>Try Again</Button>
      </div>
    </div>
  );
}
