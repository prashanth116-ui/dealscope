"use client";

import { WizardProvider } from "@/lib/wizard-context";

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return (
    <WizardProvider>
      <div className="max-w-2xl mx-auto p-6">
        {children}
      </div>
    </WizardProvider>
  );
}
