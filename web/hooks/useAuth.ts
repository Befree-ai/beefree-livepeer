"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useState, useEffect, useCallback } from "react";
import { IUser } from "@/types";

interface UseAuthReturn {
  // Privy state
  ready: boolean; // Privy SDK initialized
  authenticated: boolean; // user is logged in
  login: () => void; // open Privy login modal
  logout: () => Promise<void>;

  // Our DB user
  user: IUser | null; // our MongoDB user object
  isLoading: boolean; // fetching user from DB
  syncUser: () => Promise<void>; // manually re-sync user
}

export function useAuth(): UseAuthReturn {
  const {
    ready,
    authenticated,
    user: privyUser,
    login,
    logout,
    getAccessToken,
  } = usePrivy();

  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync Privy user to our MongoDB
  // Called after login or when we need fresh user data
  const syncUser = useCallback(async () => {
    if (!authenticated || !privyUser) {
      setUser(null);
      return;
    }

    setIsLoading(true);

    try {
      // Get Privy JWT token to verify with our backend
      const token = await getAccessToken();

      if (!token) throw new Error("No access token");

      // Extract user details from Privy user object
      // Privy stores linked accounts (email, phone, wallet)
      const email =
        privyUser.email?.address || (privyUser.google as any)?.email || "";
      const phone = privyUser.phone?.number;
      const googleAccount = privyUser.google;
      const name =
        googleAccount?.name ||
        (email ? email.split("@")[0] : "") ||
        (phone ? phone : "") ||
        "";
      const avatar = (googleAccount as any)?.profilePictureUrl || "";

      // Extract wallet address from Privy linked accounts
      const walletAccount = privyUser.linkedAccounts?.find(
        (a: any) => a.type === "wallet" && a.walletClientType === "privy",
      );
      const walletAddress = (walletAccount as any)?.address || "";

      // Call our sync endpoint
      const response = await fetch("/api/auth/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, phone, name, avatar, walletAddress }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data);
      } else {
        console.error("User sync failed:", data.error);
        setUser(null);
      }
    } catch (error) {
      console.error("useAuth syncUser error:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [authenticated, privyUser, getAccessToken]);

  // Auto-sync when auth state changes
  // When user logs in → sync to DB
  // When user logs out → clear user
  useEffect(() => {
    if (ready) {
      syncUser();
    }
  }, [ready, authenticated, syncUser]);

  return {
    ready,
    authenticated,
    login,
    logout,
    user,
    isLoading,
    syncUser,
  };
}
