"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchAllMarkets,
  fetchMarketsByType,
  type MarketsAllResponse,
} from "../lib/api-client";
import type { MarketType, MarketSnapshot } from "../lib/types";

export function useAllMarkets() {
  return useQuery<MarketsAllResponse>({
    queryKey: ["markets", "all"],
    queryFn: fetchAllMarkets,
    refetchInterval: 60 * 1000,
  });
}

export function useMarketsByType(type: MarketType) {
  return useQuery<MarketSnapshot[]>({
    queryKey: ["markets", type],
    queryFn: () => fetchMarketsByType(type),
    refetchInterval: 60 * 1000,
  });
}
