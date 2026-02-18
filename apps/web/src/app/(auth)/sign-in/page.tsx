"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
import { authLabels } from "~/lib/i18n/auth-labels";

/**
 * Inner sign-in form that reads the returnTo search param.
 *
 * WHY: useSearchParams() requires a Suspense boundary in Next.js App Router.
 * Extracted here so the outer SignInPage can wrap it in Suspense without
 * making the entire page a loading state.
 */
function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const labels = authLabels.signIn;

  // WHY: Middleware sets returnTo when redirecting unauthenticated users.
  // Using it as callbackURL ensures users land on the page they originally
  // intended to visit instead of always going to /hospital/dashboard.
  const returnTo = searchParams.get("returnTo");
  const callbackURL = returnTo ?? "/";

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
      callbackURL,
    });

    if (result.error) {
      setError(labels.errorGeneric.vi);
      setIsLoading(false);
      return;
    }

    // Middleware will redirect to the correct portal based on session
    router.push(callbackURL);
  }

  return (
    <Card>
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
