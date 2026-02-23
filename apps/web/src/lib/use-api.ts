"use client";

import { useMemo } from "react";
import { DealScopeClient } from "@dealscope/api-client";
import { useAuth } from "./auth-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://api.dealscope.app";

export function useApi(): DealScopeClient {
  const { getToken } = useAuth();

  return useMemo(
    () =>
      new DealScopeClient({
        baseUrl: API_BASE,
        getToken,
      }),
    [getToken]
  );
}
