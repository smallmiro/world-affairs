"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchGeoEvents, type GeoEventParams } from "../lib/api-client";
import { useLanguage } from "../lib/language-context";

export function useGeoEvents(params?: Omit<GeoEventParams, "lang">) {
  const { lang } = useLanguage();

  return useQuery({
    queryKey: ["geo-events", lang, params],
    queryFn: () => fetchGeoEvents({ ...params, lang }),
    refetchInterval: 120 * 1000,
  });
}
