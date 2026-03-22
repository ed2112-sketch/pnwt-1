"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const unsubscribe = trpc.emailSubscriber.unsubscribe.useMutation();

  useEffect(() => {
    if (email && token) {
      unsubscribe.mutate({ email, token });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, token]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          {unsubscribe.isPending && (
            <p className="text-muted-foreground">Unsubscribing...</p>
          )}

          {unsubscribe.isSuccess && (
            <>
              <h1 className="text-xl font-bold mb-2">Unsubscribed</h1>
              <p className="text-muted-foreground">
                You&apos;ve been unsubscribed from PNWTickets emails.
              </p>
            </>
          )}

          {unsubscribe.isError && (
            <>
              <h1 className="text-xl font-bold mb-2 text-destructive">Error</h1>
              <p className="text-muted-foreground">
                {unsubscribe.error.message || "Invalid or expired unsubscribe link."}
              </p>
            </>
          )}

          {!email && !token && !unsubscribe.isPending && (
            <>
              <h1 className="text-xl font-bold mb-2 text-destructive">Invalid Link</h1>
              <p className="text-muted-foreground">
                This unsubscribe link is missing required parameters.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
