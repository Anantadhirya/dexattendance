"use client";

import { useEffect } from "react";
import BackendUnavailable from "./backend-unavailable";

export default function AuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <BackendUnavailable onRetry={reset} />;
}
