import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";

import { cn } from "@medilink/ui";
import { ThemeProvider } from "@medilink/ui/theme";
import { Toaster } from "@medilink/ui/toast";

import { ConvexClientProvider } from "~/app/convex-client-provider";
import { env } from "~/env";
import { getToken } from "~/lib/convex";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? `https://${env.VERCEL_URL ?? "medilink.app"}`
      : "http://localhost:3002",
  ),
  title: "MediLink — Quản lý Thiết bị Y tế",
  description:
    "Hệ thống quản lý thiết bị y tế dành cho trường SPMET — Medical equipment management system for SPMET Healthcare School",
  openGraph: {
    title: "MediLink — Quản lý Thiết bị Y tế",
    description:
      "Hệ thống quản lý thiết bị y tế dành cho trường SPMET — Medical equipment management system for SPMET Healthcare School",
    siteName: "MediLink",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default async function RootLayout(props: { children: React.ReactNode }) {
  // Fetch auth token server-side for SSR hydration.
  // WHY: Passing the token as initialToken to ConvexBetterAuthProvider
  // avoids an extra round-trip on the client for authentication,
  // making the initial page load faster and preventing auth flicker.
  const initialToken = await getToken();

  // Read CSP nonce from proxy headers.
  // WHY: The proxy generates a per-request nonce for Content-Security-Policy.
  // Passing it here allows Next.js to tag inline scripts with the correct nonce.
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? undefined;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
        nonce={nonce}
      >
        <ThemeProvider>
          <ConvexClientProvider initialToken={initialToken}>
            {props.children}
          </ConvexClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
