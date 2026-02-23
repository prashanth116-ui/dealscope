"use client";

import { AuthGuard } from "@/lib/auth-guard";
import { Sidebar } from "@/components/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto bg-gray-50 pt-14 md:pt-0">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
