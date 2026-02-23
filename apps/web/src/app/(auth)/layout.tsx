import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-primary">DealScope</h1>
          <p className="mt-1 text-sm text-muted-foreground">Real Estate Analysis</p>
        </div>
        {children}
      </div>
    </div>
  );
}
