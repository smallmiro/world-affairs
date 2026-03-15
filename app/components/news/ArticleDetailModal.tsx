"use client";

import { useEffect } from "react";
import type { Article } from "../../../src/domain/news/entities";
import type { Language } from "../../lib/types";
import {
  mapSeverity,
  getCategoryLabel,
  formatTime,
  getTranslatedText,
  SEVERITY_STYLES,
  SEVERITY_LABELS,
} from "../../lib/display-mappers";
import { t } from "../../i18n";

interface ArticleDetailModalProps {
  article: Article;
  lang: Language;
  onClose: () => void;
}

export default function ArticleDetailModal({ article, lang, onClose }: ArticleDetailModalProps) {
  const displaySeverity = mapSeverity(article.severity);
  const s = SEVERITY_STYLES[displaySeverity];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto border"
        style={{
          background: "var(--bg-secondary)",
          borderColor: "var(--border)",
          animation: "fade-in-up 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div
          className="sticky top-0 flex items-center justify-between px-5 py-3 border-b"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-mono text-[0.75rem] font-bold tracking-[1px] px-1.5 py-px uppercase"
              style={{ color: s.color, background: s.bg }}
            >
              {SEVERITY_LABELS[displaySeverity]}
            </span>
            <span
              className="font-mono text-[0.75rem] tracking-[0.5px] px-1.5 py-px border"
              style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
            >
              {getCategoryLabel(article.category, lang)}
            </span>
            <span
              className="font-mono text-[0.75rem] tracking-[0.5px] px-1.5 py-px border"
              style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}
            >
              {t(lang, `regions.${article.region}`)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[0.8rem] w-11 h-11 flex items-center justify-center rounded cursor-pointer"
            style={{ color: "var(--text-muted)" }}
          >
            ✕
          </button>
        </div>

        {/* Left accent bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: s.bar }} />

        {/* Content */}
        <div className="px-5 py-4 pl-6">
          {/* Image */}
          {article.imageUrl && (
            <div className="mb-4 overflow-hidden border" style={{ borderColor: "var(--border)" }}>
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-48 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          {/* Title */}
          <h3
            className="text-[1.1rem] font-semibold leading-[1.4] mb-3"
            style={{ color: "var(--text-primary)", fontFamily: "var(--font-noto-sans-kr)" }}
          >
            {getTranslatedText(article.title, lang)}
          </h3>

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[0.85rem]" style={{ color: "var(--text-muted)" }}>
              {formatTime(article.publishedAt)}
            </span>
            <span className="font-mono text-[0.85rem]" style={{ color: "var(--accent-cyan)" }}>
              {article.source}
            </span>
          </div>

          {/* Summary */}
          {article.summary && (
            <div className="mb-4">
              <div
                className="font-mono text-[0.75rem] tracking-[1px] uppercase mb-2"
                style={{ color: "var(--text-muted)" }}
              >
                {t(lang, "news.summary")}
              </div>
              <div
                className="text-[0.82rem] leading-[1.6]"
                style={{ color: "var(--text-secondary)", fontFamily: "var(--font-noto-sans-kr)" }}
              >
                {getTranslatedText(article.summary, lang)}
              </div>
            </div>
          )}

          {/* Multilingual titles */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <div
              className="font-mono text-[0.75rem] tracking-[1px] uppercase mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              {t(lang, "news.multilingual")}
            </div>
            <div className="flex flex-col gap-1.5">
              {article.title.en && (
                <div className="flex gap-2">
                  <span className="font-mono text-[0.75rem] shrink-0 mt-0.5" style={{ color: "var(--accent-cyan)" }}>EN</span>
                  <span className="text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>{article.title.en}</span>
                </div>
              )}
              {article.title.ko && article.title.ko !== article.title.en && (
                <div className="flex gap-2">
                  <span className="font-mono text-[0.75rem] shrink-0 mt-0.5" style={{ color: "var(--accent-amber)" }}>KO</span>
                  <span className="text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>{article.title.ko}</span>
                </div>
              )}
              {article.title.ja && article.title.ja !== article.title.en && (
                <div className="flex gap-2">
                  <span className="font-mono text-[0.75rem] shrink-0 mt-0.5" style={{ color: "var(--accent-red)" }}>JA</span>
                  <span className="text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>{article.title.ja}</span>
                </div>
              )}
            </div>
          </div>

          {/* Source link */}
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.65rem] tracking-[0.5px] px-3 py-1.5 border rounded inline-block transition-all duration-150"
              style={{
                color: "var(--accent-cyan)",
                borderColor: "var(--accent-cyan)",
                background: "var(--accent-cyan-dim)",
              }}
            >
              {t(lang, "news.viewOriginal")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
