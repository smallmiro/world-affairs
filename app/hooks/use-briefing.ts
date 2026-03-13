"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBriefing } from "../lib/api-client";
import { useLanguage } from "../lib/language-context";

export function useBriefing() {
  const { lang } = useLanguage();

  return useQuery({
    queryKey: ["briefing", lang],
    queryFn: () => fetchBriefing(lang),
    refetchInterval: 5 * 60 * 1000,
  });
}
