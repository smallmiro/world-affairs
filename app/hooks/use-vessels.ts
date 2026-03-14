"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchVessels, type VesselParams } from "../lib/api-client";

interface UseVesselsOptions extends VesselParams {
  refetchInterval?: number;
}

export function useVessels(options?: UseVesselsOptions) {
  const { refetchInterval = 120_000, ...params } = options ?? {};
  return useQuery({
    queryKey: ["vessels", params],
    queryFn: () => fetchVessels(Object.keys(params).length > 0 ? params : undefined),
    refetchInterval,
  });
}
