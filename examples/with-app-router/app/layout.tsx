import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "daya-next example",
  description: "Next.js App Router + @okeke-dev/daya-next",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>{children}</body>
    </html>
  );
}
