"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@medilink/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@medilink/ui/card";
import { Input } from "@medilink/ui/input";
import { Label } from "@medilink/ui/label";

import { signIn } from "~/auth/client";
import { env } from "~/env";
import { authLabels } from "~/lib/i18n/auth-labels";

/**
 * Inner sign-in form that reads the returnTo search param.
 *
 * WHY: Single sign-in entry point for all users (hospital, provider, platform admin).
 * After sign-in, redirects to "/" — the proxy's Branch 1.5 detects the missing
 * medilink-org-context cookie and redirects to /api/auth/init, which sets the
 * cookie server-side and routes to the correct portal dashboard.
 *
 * The returnTo query param is respected to restore deep-link navigation context.
 * useSearchParams() requires a Suspense boundary in Next.js App Router.
 */
function SignInForm() {
  const searchParams = useSearchParams();
  const labels = authLabels.signIn;

  // WHY: Middleware sets returnTo when redirecting unauthenticated users.
  // Using it as a safe fallback ensures users land on the page they originally
  // intended to visit instead of always going to a default dashboard.
  //
  // Security: validate that returnTo is a safe relative path before using it.
  // Accepting arbitrary values enables open redirect attacks (e.g., ?returnTo=https://evil.com
  // or ?returnTo=//evil.com which the browser interprets as protocol-relative).
  // Only allow paths that start with '/' but NOT '//' (protocol-relative URLs).
  const returnTo = searchParams.get("returnTo");
  const safeReturnTo =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn.email({
      email,
      password,
    });

    if (result.error) {
      const msg = result.error.message ?? "";
      if (
        msg.toLowerCase().includes("invalid email or password") ||
        msg.toLowerCase().includes("invalid_email_or_password")
      ) {
        setError("Email hoặc mật khẩu không đúng. (Invalid email or password)");
      } else {
        setError(`${labels.errorGeneric.vi} (${msg || "unknown error"})`);
      }
      setIsLoading(false);
      return;
    }

    // Redirect to /api/auth/init to set the routing cookie server-side and land on
    // the correct portal. WHY: We can't redirect to "/" because the proxy treats it
    // as a public path (no Branch 1.5 interception). /api/auth/init is in
    // BYPASS_PREFIXES so the proxy never intercepts it — the route handles
    // Convex lookup + cookie set + portal redirect atomically.
    const initUrl = new URL("/api/auth/init", window.location.origin);
    if (safeReturnTo) initUrl.searchParams.set("returnTo", safeReturnTo);
    window.location.href = initUrl.toString();
  }

  return (
    <Card>
      {env.NODE_ENV === "development" && (
        <div className="border-b bg-amber-50 px-4 py-1 text-center text-xs text-amber-700">
          🛠 Dev server:{" "}
          {typeof window !== "undefined" ? window.location.origin : ""} &middot;{" "}
          <a href="/api/health" className="underline">
            health check
          </a>
        </div>
      )}

      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{labels.title.vi}</CardTitle>
        <CardDescription>{labels.subtitle.vi}</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{labels.email.vi}</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{labels.password.vi}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? labels.loading.vi : labels.submit.vi}
          </Button>

          <p className="text-muted-foreground text-center text-sm">
            {labels.noAccount.vi}{" "}
            <Link
              href="/sign-up"
              className="hover:text-primary underline underline-offset-4"
            >
              {labels.signUpLink.vi}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

/**
 * Sign-in page for all portal users.
 *
 * WHY: Single sign-in entry point for all users (hospital, provider, platform admin).
 * After sign-in, middleware routes to the correct portal based on session data.
 * Suspense boundary is required by Next.js App Router when using useSearchParams.
 */
export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
