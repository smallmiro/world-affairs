"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../lib/language-context";
import { useNews } from "../../hooks/use-news";
import { useGeoEvents } from "../../hooks/use-geo-events";
import { useT } from "../../hooks/use-t";
import StatusLight from "../ui/StatusLight";

const NAV_KEYS = ["overview", "map", "vessels", "markets", "analysis", "briefing"] as const;

const NAV_TABS = ["OVERVIEW", "MAP", "VESSELS", "MARKETS", "ANALYSIS", "BRIEFING"] as const;

const TAB_SECTION_MAP: Record<string, string> = {
  OVERVIEW: "section-overview",
  MAP: "section-map",
  VESSELS: "section-vessels",
  MARKETS: "section-markets",
  ANALYSIS: "section-analysis",
  BRIEFING: "section-analysis",
};

const LANG_DISPLAY: Record<string, string> = {
  ko: "KR",
  en: "EN",
  ja: "JA",
};

const THEME_STORAGE_KEY = "sigint-theme";

export default function TopBar() {
  const [activeTab, setActiveTab] = useState<string>("OVERVIEW");
  const [time, setTime] = useState("");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const { lang, cycleLang } = useLanguage();
  const t = useT();
  const { data: news } = useNews({ limit: 50 });
  const { data: events } = useGeoEvents({ limit: 50 });

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === "light") {
      setTheme("light");
      document.documentElement.classList.add("light");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
    localStorage.setItem(THEME_STORAGE_KEY, next);
  };

  useEffect(() => {
    const update = () =>
      setTime(new Date().toLocaleTimeString("ko-KR", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const criticalCount =
    (news?.filter((a) => a.severity === "critical").length ?? 0) +
    (events?.filter((e) => e.severity === "critical").length ?? 0);

  return (
    <header
      className="sticky top-0 z-[1000] flex items-center justify-between px-6 h-[52px] border-b"
      style={{
        background: theme === "light" ? "rgba(213,214,219,0.92)" : "rgba(26,27,38,0.92)",
        backdropFilter: "blur(12px)",
        borderColor: "var(--border)",
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span
          className="font-mono font-bold text-[1.1rem] tracking-[3px]"
          style={{ color: "var(--accent-cyan)", textShadow: "var(--glow-cyan)" }}
        >
          SIGINT
        </span>
        <span className="w-px h-5" style={{ background: "var(--border-active)" }} />
        <span className="text-[0.78rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
          {t("topbar.subtitle")}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex gap-0.5">
        {NAV_TABS.map((tab, idx) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              const sectionId = TAB_SECTION_MAP[tab];
              if (sectionId) {
                document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="font-mono text-[0.72rem] tracking-[1px] uppercase px-4 py-2.5 border cursor-pointer transition-all duration-200"
            style={{
              color: activeTab === tab ? "var(--accent-cyan)" : "var(--text-muted)",
              borderColor: activeTab === tab ? "var(--border-active)" : "transparent",
              background: activeTab === tab ? "var(--bg-card)" : "transparent",
            }}
          >
            {t(`nav.${NAV_KEYS[idx]}`)}
          </button>
        ))}
      </nav>

      {/* Status */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1.5 font-mono text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
          <StatusLight color="green" size={6} pulse={true} glow={false} />
          LIVE
        </div>
        <span className="font-mono text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
          UPD {time || "--:--:--"} KST
        </span>
        <span className="font-mono text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
          SRC: 24 FEEDS
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          aria-label="알림"
          className="relative w-11 h-11 grid place-items-center border cursor-pointer transition-all duration-200 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
          style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {criticalCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full grid place-items-center font-mono text-[0.75rem] text-white"
              style={{
                background: "var(--accent-red)",
                animation: "pulse-badge 1.5s ease-in-out infinite",
              }}
            >
              {criticalCount}
            </span>
          )}
        </button>
        <button
          aria-label="설정"
          className="w-11 h-11 grid place-items-center border cursor-pointer transition-all duration-200 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
          style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
        <button
          aria-label="테마 변경"
          onClick={toggleTheme}
          className="w-11 h-11 grid place-items-center border font-mono text-[0.72rem] cursor-pointer transition-all duration-200 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
          style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          {theme === "dark" ? "\u2600" : "\u25CF"}
        </button>
        <button
          aria-label="언어 변경"
          onClick={cycleLang}
          className="w-11 h-11 grid place-items-center border font-mono text-[0.72rem] cursor-pointer transition-all duration-200 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
          style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          {LANG_DISPLAY[lang]}
        </button>
      </div>
    </header>
  );
}
