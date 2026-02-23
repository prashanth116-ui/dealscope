"use client";

import { useAuth } from "@/lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-primary mb-6">Settings</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="text-sm font-medium">{user?.name || "Not set"}</div>
          </div>
          <Separator />
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="text-sm font-medium">{user?.email || "Not set"}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Defaults & Subscription</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Coming soon - configure default assumptions, subscription tier, and preferences.</p>
        </CardContent>
      </Card>
    </div>
  );
}
