import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "daya-next basic example",
  description: "Minimal App Router example for @okeke-dev/daya-next + @okeke-dev/daya-sdk",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem" }}>
        <nav style={{ marginBottom: "1.5rem", display: "flex", gap: "1rem" }}>
          <a href="/">Home</a>
          <a href="/customers/new">New customer</a>
          <a href="/funding/new">New funding account</a>
          <a href="/status">Webhook status</a>
        </nav>
        {children}
      </body>
    </html>
  );
}
