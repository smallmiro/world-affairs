"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "../../lib/language-context";
import { useNews } from "../../hooks/use-news";
import { useGeoEvents } from "../../hooks/use-geo-events";
import { useT } from "../../hooks/use-t";
import StatusLight from "../ui/StatusLight";
import AlertPanel from "./AlertPanel";

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
  const [alertOpen, setAlertOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeAlert = useCallback(() => setAlertOpen(false), []);
  const menuRef = useRef<HTMLDivElement>(null);
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
    const update = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, "0");
      const m = String(now.getUTCMinutes()).padStart(2, "0");
      const s = String(now.getUTCSeconds()).padStart(2, "0");
      setTime(`${h}시 ${m}분 ${s}초`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  // Close menu on ESC key
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    const sectionId = TAB_SECTION_MAP[tab];
    if (sectionId) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const criticalCount =
    (news?.filter((a) => a.severity === "critical").length ?? 0) +
    (events?.filter((e) => e.severity === "critical").length ?? 0);

  return (
    <>
      <header
        className="sticky top-0 z-[1000] flex items-center justify-between px-4 md:px-6 h-[52px] border-b"
        style={{
          background: theme === "light" ? "rgba(213,214,219,0.92)" : "rgba(26,27,38,0.92)",
          backdropFilter: "blur(12px)",
          borderColor: "var(--border)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span
            className="font-mono font-bold text-[1.4rem] tracking-[3px]"
            style={{ color: "var(--accent-cyan)", textShadow: "var(--glow-cyan)" }}
          >
            SIGINT
          </span>
          <span className="hidden lg:inline w-px h-5" style={{ background: "var(--border-active)" }} />
          <span className="hidden lg:inline text-[0.95rem] tracking-[1px]" style={{ color: "var(--text-muted)" }}>
            {t("topbar.subtitle")}
          </span>
        </div>

        {/* Nav — desktop (lg+) */}
        <nav className="hidden lg:flex gap-0.5">
          {NAV_TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className="font-mono text-[0.85rem] tracking-[1px] uppercase px-4 py-2.5 border rounded cursor-pointer transition-all duration-200"
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
          <span className="hidden md:inline font-mono text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
            UPD {time || "--:--:--"} UTC
          </span>
          <span className="hidden lg:inline font-mono text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
            SRC: 24 FEEDS
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Hamburger — mobile only */}
          <button
            aria-label="메뉴 열기"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((v) => !v)}
            className="lg:hidden w-11 h-11 grid place-items-center border rounded cursor-pointer transition-all duration-200 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
            style={{
              background: isMenuOpen ? "var(--bg-card)" : "transparent",
              borderColor: isMenuOpen ? "var(--accent-cyan)" : "var(--border)",
              color: isMenuOpen ? "var(--accent-cyan)" : "var(--text-secondary)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {isMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          <button
            aria-label="알림"
            onClick={() => setAlertOpen((v) => !v)}
            className="relative w-11 h-11 grid place-items-center border rounded cursor-pointer transition-all duration-200 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
            style={{
              background: alertOpen ? "var(--bg-card)" : "transparent",
              borderColor: alertOpen ? "var(--accent-cyan)" : "var(--border)",
              color: alertOpen ? "var(--accent-cyan)" : "var(--text-secondary)",
            }}
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
          <AlertPanel open={alertOpen} onClose={closeAlert} />
          <button
            aria-label="테마 변경"
            onClick={toggleTheme}
            className="w-11 h-11 grid place-items-center border rounded cursor-pointer transition-all duration-200 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
            style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            {theme === "dark" ? "LT" : "DK"}
          </button>
          <button
            aria-label="언어 변경"
            onClick={cycleLang}
            className="w-11 h-11 grid place-items-center border rounded font-mono text-[0.72rem] cursor-pointer transition-all duration-200 hover:border-[var(--accent-cyan)] hover:text-[var(--accent-cyan)]"
            style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            {LANG_DISPLAY[lang]}
          </button>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {isMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 top-[52px] z-[999]"
          onClick={() => setIsMenuOpen(false)}
          style={{ background: "rgba(0,0,0,0.5)" }}
        />
      )}

      {/* Mobile drawer menu */}
      <div
        ref={menuRef}
        className="lg:hidden fixed left-0 right-0 top-[52px] z-[1000] overflow-hidden transition-all duration-200 border-b"
        style={{
          maxHeight: isMenuOpen ? `${NAV_TABS.length * 48 + 16}px` : "0px",
          opacity: isMenuOpen ? 1 : 0,
          background: theme === "light" ? "rgba(213,214,219,0.98)" : "rgba(26,27,38,0.98)",
          backdropFilter: "blur(12px)",
          borderColor: isMenuOpen ? "var(--border)" : "transparent",
        }}
      >
        <nav className="flex flex-col py-2">
          {NAV_TABS.map((tab, idx) => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className="font-mono text-[0.85rem] tracking-[1px] uppercase px-6 py-3 text-left cursor-pointer transition-all duration-200"
              style={{
                color: activeTab === tab ? "var(--accent-cyan)" : "var(--text-muted)",
                background: activeTab === tab ? "var(--bg-card)" : "transparent",
                borderLeft: activeTab === tab ? "2px solid var(--accent-cyan)" : "2px solid transparent",
              }}
            >
              {t(`nav.${NAV_KEYS[idx]}`)}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
