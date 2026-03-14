"use client";

import { useState } from "react";
import { useNews } from "../../hooks/use-news";
import { useLanguage } from "../../lib/language-context";
import SectionHeader from "../ui/SectionHeader";
import ArticleDetailModal from "./ArticleDetailModal";
import type { Article } from "../../../src/domain/news/entities";
import {
  mapSeverity,
  getCategoryLabel,
  formatTime,
  getTranslatedText,
  SEVERITY_STYLES,
  SEVERITY_LABELS,
} from "../../lib/display-mappers";
import type { NewsCategory, Region } from "../../lib/types";

const FILTERS: { label: string; category?: NewsCategory }[] = [
  { label: "전체" },
  { label: "외교", category: "diplomacy" },
  { label: "군사", category: "military" },
  { label: "경제", category: "economy" },
  { label: "환경", category: "environment" },
  { label: "인권", category: "human_rights" },
];

const REGION_FILTERS: { label: string; region?: Region }[] = [
  { label: "전체" },
  { label: "동아시아", region: "east-asia" },
  { label: "중동", region: "middle-east" },
  { label: "유럽", region: "europe" },
  { label: "북미", region: "north-america" },
];

export default function NewsFeed() {
  const [activeFilter, setActiveFilter] = useState(0);
  const [activeRegion, setActiveRegion] = useState(0);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const { lang } = useLanguage();
  const filterCategory = FILTERS[activeFilter].category;
  const filterRegion = REGION_FILTERS[activeRegion].region;
  const { data: articles, isLoading, error } = useNews({
    ...(filterCategory && { category: filterCategory }),
    ...(filterRegion && { region: filterRegion }),
    limit: 20,
  });

  return (
    <section
      className="p-5 flex flex-col max-h-[700px]"
      style={{ animation: "fade-in-up 0.4s ease-out 0.1s both" }}
    >
      <div className="mb-4">
        <SectionHeader title="실시간 뉴스" accentColor="var(--accent-cyan)" />
      </div>

      <div className="flex gap-1 flex-wrap mb-3">
        {FILTERS.map((f, i) => (
          <button
            key={f.label}
            onClick={() => setActiveFilter(i)}
            className="font-mono text-[0.62rem] tracking-[0.5px] px-2 py-[3px] border cursor-pointer transition-all duration-150"
            style={{
              color: activeFilter === i ? "var(--accent-cyan)" : "var(--text-muted)",
              borderColor: activeFilter === i ? "var(--accent-cyan)" : "var(--border)",
              background: activeFilter === i ? "var(--accent-cyan-dim)" : "transparent",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 flex-wrap mb-3">
        {REGION_FILTERS.map((f, i) => (
          <button
            key={f.label}
            onClick={() => setActiveRegion(i)}
            className="font-mono text-[0.62rem] tracking-[0.5px] px-2 py-[3px] border cursor-pointer transition-all duration-150"
            style={{
              color: activeRegion === i ? "var(--accent-cyan)" : "var(--text-muted)",
              borderColor: activeRegion === i ? "var(--accent-cyan)" : "var(--border)",
              background: activeRegion === i ? "var(--accent-cyan-dim)" : "transparent",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-0.5">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono text-[0.72rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
              LOADING...
            </span>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono text-[0.72rem]" style={{ color: "var(--accent-red)" }}>
              데이터를 불러올 수 없습니다
            </span>
          </div>
        )}
        {articles?.map((item) => {
          const displaySeverity = mapSeverity(item.severity);
          const s = SEVERITY_STYLES[displaySeverity];
          return (
            <div
              key={item.id}
              className="news-item-card relative pl-3 pr-3 py-3 border cursor-pointer transition-all duration-150"
              onClick={() => setSelectedArticle(item as unknown as Article)}
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5"
                style={{ background: s.bar }}
              />

              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="font-mono text-[0.55rem] font-bold tracking-[1px] px-1.5 py-px uppercase"
                  style={{ color: s.color, background: s.bg }}
                >
                  {SEVERITY_LABELS[displaySeverity]}
                </span>
                <span className="font-mono text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                  {formatTime(item.publishedAt)}
                </span>
                <span className="font-mono text-[0.55rem] tracking-[0.5px] ml-auto" style={{ color: "var(--text-muted)" }}>
                  {getCategoryLabel(item.category, lang)}
                </span>
              </div>

              <div className="text-[0.82rem] font-medium leading-[1.4] mb-1" style={{ color: "var(--text-primary)" }}>
                {getTranslatedText(item.title, lang)}
              </div>
              {item.summary && (
                <div className="text-[0.58rem] line-clamp-2 mb-1" style={{ color: "var(--text-muted)" }}>
                  {getTranslatedText(item.summary, lang)}
                </div>
              )}
              <div className="font-mono text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                {item.source}
              </div>
            </div>
          );
        })}
        {articles?.length === 0 && !isLoading && (
          <div className="flex items-center justify-center py-12">
            <span className="font-mono text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
              NO DATA
            </span>
          </div>
        )}
      </div>

      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          lang={lang}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </section>
  );
}
