import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DealScope - Commercial Property Analyzer",
  description:
    "Analyze multifamily and commercial real estate deals with professional-grade tools.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
