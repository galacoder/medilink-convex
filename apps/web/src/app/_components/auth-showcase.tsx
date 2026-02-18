import { redirect } from "next/navigation";

import { Button } from "@medilink/ui/button";

import { getSession } from "~/auth/server";

export async function AuthShowcase() {
  const session = await getSession();

  if (!session) {
    return (
      <form>
        <Button
          size="lg"
          formAction={async () => {
            "use server";
            // Redirect to the sign-in page
            // WHY: With the Convex component model, social sign-in is handled
            // via the Better Auth API route at /api/auth/sign-in/social
            redirect("/sign-in");
          }}
        >
          Sign in with Google
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl">
        <span>Logged in</span>
      </p>

      <form>
        <Button
          size="lg"
          formAction={async () => {
            "use server";
            // Sign out via the Better Auth API route
            // WHY: The Convex Better Auth handler at /api/auth/[...all]
            // handles the sign-out operation server-side
            redirect("/api/auth/sign-out");
          }}
        >
          Sign out
        </Button>
      </form>
    </div>
  );
}
