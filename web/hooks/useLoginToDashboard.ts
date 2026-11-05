"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@privy-io/react-auth";
import { useAuth } from "@/hooks/useAuth";

// Opens Privy login and sends the user to the dashboard as soon as login completes.
// Already signed in? Goes straight to the dashboard.
export function useLoginToDashboard() {
  const { authenticated } = useAuth();
  const router = useRouter();

  const { login } = useLogin({
    onComplete: () => router.push("/dashboard"),
  });

  const start = useCallback(() => {
    if (authenticated) {
      router.push("/dashboard");
      return;
    }
    login();
  }, [authenticated, login, router]);

  return { start, authenticated };
}