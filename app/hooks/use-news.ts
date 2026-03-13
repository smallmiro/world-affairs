"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchNews, type NewsParams } from "../lib/api-client";
import { useLanguage } from "../lib/language-context";

export function useNews(params?: Omit<NewsParams, "lang">) {
  const { lang } = useLanguage();

  return useQuery({
    queryKey: ["news", lang, params],
    queryFn: () => fetchNews({ ...params, lang }),
    refetchInterval: 60 * 1000,
  });
}
