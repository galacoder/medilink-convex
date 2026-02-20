"use client";

import { useState } from "react";
import Link from "next/link";

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
import { RadioGroup, RadioGroupItem } from "@medilink/ui/radio-group";

import { signUp } from "~/auth/client";
import { authLabels } from "~/lib/i18n/auth-labels";

type OrgType = "hospital" | "provider";

/**
 * Sign-up page — creates user account + organization in one flow.
 *
 * WHY: New users must be associated with an organization at sign-up time
 * to determine their portal (hospital vs provider). Capturing org_type
 * here drives all subsequent portal routing decisions.
 *
 * NOTE: We bypass Better Auth's organization plugin because
 * @convex-dev/better-auth v0.10.10 doesn't support the "member" model.
 * Instead, we call our custom /api/org/create route which:
 *   1. Creates the org in our custom Convex tables
 *   2. Sets a medilink-org-context routing cookie (orgType:orgId)
 *   3. The proxy.ts reads this cookie for portal routing
 */
export default function SignUpPage() {
  const labels = authLabels.signUp;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgType, setOrgType] = useState<OrgType>("hospital");
  const [orgName, setOrgName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Step 1: Create user account via Better Auth
    const signUpResult = await signUp.email({
      email,
      password,
      name,
      callbackURL:
        orgType === "hospital" ? "/hospital/dashboard" : "/provider/dashboard",
    });

    if (signUpResult.error) {
      setError(labels.errorGeneric.vi);
      setIsLoading(false);
      return;
    }

    // Step 2: Create organization via custom API route.
    //
    // WHY custom route instead of organization.create():
    // @convex-dev/better-auth v0.10.10 rejects the "member" model needed by
    // Better Auth's org plugin (ArgumentValidationError). Our custom route
    // writes directly to our Convex organizations + organizationMemberships tables
    // and sets a medilink-org-context cookie for portal routing.
    const orgSlug = slugify(orgName) || `org-${Date.now()}`;
    const orgRes = await fetch("/api/org/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: orgName,
        slug: orgSlug,
        orgType,
      }),
      credentials: "include",
    });

    if (!orgRes.ok) {
      const errBody = (await orgRes.json().catch(() => ({}))) as {
        error?: string;
      };
      setError(errBody.error ?? labels.errorGeneric.vi);
      setIsLoading(false);
      return;
    }

    // Step 3: Redirect to the correct portal.
    // The proxy.ts will allow access once the medilink-org-context cookie is set
    // (done by /api/org/create above). A hard navigation is used to ensure the
    // cookie is sent with the next request.
    window.location.href =
      orgType === "hospital" ? "/hospital/dashboard" : "/provider/dashboard";
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
            <Label htmlFor="name">{labels.name.vi}</Label>
            <Input
              id="name"
              type="text"
              placeholder="Nguyễn Văn A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

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
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div className="space-y-3">
            <Label>{labels.orgType.vi}</Label>
            <RadioGroup
              value={orgType}
              onValueChange={(value) => setOrgType(value as OrgType)}
              className="grid grid-cols-2 gap-3"
              disabled={isLoading}
            >
              <div
                className={`hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors ${
                  orgType === "hospital"
                    ? "border-primary bg-accent"
                    : "border-input"
                }`}
              >
                <RadioGroupItem value="hospital" id="hospital" />
                <Label
                  htmlFor="hospital"
                  className="cursor-pointer text-sm font-normal"
                >
                  {labels.hospital.vi}
                </Label>
              </div>
              <div
                className={`hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border p-3 transition-colors ${
                  orgType === "provider"
                    ? "border-primary bg-accent"
                    : "border-input"
                }`}
              >
                <RadioGroupItem value="provider" id="provider" />
                <Label
                  htmlFor="provider"
                  className="cursor-pointer text-sm font-normal"
                >
                  {labels.provider.vi}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgName">{labels.orgName.vi}</Label>
            <Input
              id="orgName"
              type="text"
              placeholder={
                orgType === "hospital"
                  ? "Bệnh viện Đại học Y Dược TP.HCM"
                  : "Công ty Thiết bị Y tế ABC"
              }
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? labels.loading.vi : labels.submit.vi}
          </Button>

          <p className="text-muted-foreground text-center text-sm">
            {labels.hasAccount.vi}{" "}
            <Link
              href="/sign-in"
              className="hover:text-primary underline underline-offset-4"
            >
              {labels.signInLink.vi}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
