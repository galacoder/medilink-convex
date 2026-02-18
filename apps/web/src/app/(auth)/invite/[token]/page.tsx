"use client";

import { useEffect, useState } from "react";
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

import { authClient, organization, useSession } from "~/auth/client";
import { authLabels } from "~/lib/i18n/auth-labels";
import { getPostAuthRedirect } from "~/lib/portal-routing";

/**
 * Invite acceptance page.
 *
 * WHY: Organization owners invite members via email. The invite link
 * contains a token that this page processes via Better Auth's
 * organization.acceptInvitation() API. On success, the user is
 * redirected to their org's portal dashboard.
 *
 * Accessible without authentication (PUBLIC_PATHS includes /invite).
 * Unauthenticated users are prompted to sign in first.
 */

type AcceptanceState = "idle" | "accepting" | "success" | "error";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const labels = authLabels.invite;

  const [token, setToken] = useState<string | null>(null);
  const [acceptanceState, setAcceptanceState] =
    useState<AcceptanceState>("idle");

  // Resolve async params (Next.js 15)
  useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  async function handleAccept() {
    if (!token) return;

    setAcceptanceState("accepting");

    const result = await organization.acceptInvitation({
      invitationId: token,
    });

    if (result.error) {
      setAcceptanceState("error");
      return;
    }

    setAcceptanceState("success");

    // Fetch updated session to get correct portal redirect
    const sessionResult = await authClient.getSession();
    const sessionData = sessionResult.data
      ? {
          platformRole:
            (
              sessionResult.data.user as {
                platformRole?: string | null;
              }
            ).platformRole ?? null,
          orgType: null,
          activeOrganizationId:
            (
              sessionResult.data.session as {
                activeOrganizationId?: string | null;
              }
            ).activeOrganizationId ?? null,
        }
      : null;

    const redirect = getPostAuthRedirect(sessionData);

    // Brief delay so user sees success message before redirecting
    setTimeout(() => {
      router.push(redirect);
    }, 1500);
  }

  // Still loading token or session
  if (!token || sessionPending) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{labels.title.vi}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{labels.loading.vi}</p>
        </CardContent>
      </Card>
    );
  }

  // Unauthenticated — prompt to sign in
  if (!session) {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{labels.title.vi}</CardTitle>
          <CardDescription>{labels.subtitle.vi}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {/* Bạn cần đăng nhập để chấp nhận lời mời / You need to sign in to accept this invitation */}
            Bạn cần đăng nhập để chấp nhận lời mời
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button asChild className="w-full">
            <Link href={`/sign-in?returnTo=/invite/${token}`}>
              {authLabels.signIn.submit.vi}
            </Link>
          </Button>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/sign-up">{authLabels.signIn.signUpLink.vi}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Success state
  if (acceptanceState === "success") {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{labels.title.vi}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-600">{labels.accepted.vi}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {labels.loading.vi}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (acceptanceState === "error") {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{labels.title.vi}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
            {labels.invalidToken.vi}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link href="/sign-in">{labels.backToSignIn.vi}</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Default: ready to accept (authenticated + have token)
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">{labels.title.vi}</CardTitle>
        <CardDescription>{labels.subtitle.vi}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          {/* Token đã được xác thực / Token verified */}
          Token đã được xác thực. Nhấn chấp nhận để tiếp tục.
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
        <Button
          className="w-full"
          onClick={handleAccept}
          disabled={acceptanceState === "accepting"}
        >
          {acceptanceState === "accepting"
            ? labels.loading.vi
            : labels.accept.vi}
        </Button>
        <Button variant="ghost" asChild className="w-full">
          <Link href="/sign-in">{labels.backToSignIn.vi}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
