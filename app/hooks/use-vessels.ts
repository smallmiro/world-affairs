"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVessels, type VesselParams } from "../lib/api-client";

export function useVessels(params?: VesselParams) {
  return useQuery({
    queryKey: ["vessels", params],
    queryFn: () => fetchVessels(params),
    refetchInterval: 120 * 1000,
  });
}
