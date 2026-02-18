"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
 * Sign-in page for all portal users.
 *
 * WHY: Single sign-in entry point for all users (hospital, provider, platform admin).
 * After sign-in, middleware routes to the correct portal based on session data.
 */
export default function SignInPage() {
  const router = useRouter();
  const labels = authLabels.signIn;

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
      callbackURL: "/hospital/dashboard",
    });

    if (result.error) {
      setError(labels.errorGeneric.vi);
      setIsLoading(false);
      return;
    }

    // Middleware will redirect to the correct portal based on session
    router.push("/hospital/dashboard");
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
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
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

          <p className="text-center text-sm text-muted-foreground">
            {labels.noAccount.vi}{" "}
            <Link
              href="/sign-up"
              className="underline underline-offset-4 hover:text-primary"
            >
              {labels.signUpLink.vi}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
