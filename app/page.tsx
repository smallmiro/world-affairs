"use client";

import { useT } from "./hooks/use-t";
import TopBar from "./components/layout/TopBar";
import AlertTicker from "./components/layout/AlertTicker";
import MarketTickerBar from "./components/layout/MarketTickerBar";
import WorldMap from "./components/map/WorldMap";
import NewsFeed from "./components/news/NewsFeed";
import IssueTracker from "./components/issues/IssueTracker";
import VesselTracking from "./components/vessels/VesselTracking";
import AirportMonitor from "./components/airport/AirportMonitor";
import MarketSection from "./components/markets/MarketSection";
import AiAnalysis from "./components/analysis/AiAnalysis";

export default function DashboardPage() {
  const t = useT();
  return (
    <main id="section-overview" className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <TopBar />
      <AlertTicker />
      <MarketTickerBar />

      {/* Dashboard grid */}
      <div
        id="section-map"
        className="grid gap-px"
        style={{ background: "var(--border)" }}
      >
        {/* Row 1: World Map */}
        <div style={{ background: "var(--bg-primary)" }}>
          <WorldMap />
        </div>

        {/* Row 1-2: News Feed (spans 2 rows on desktop) */}
        <div
          className="section-map-news"
          style={{ background: "var(--bg-primary)" }}
        >
          <NewsFeed />
        </div>

        {/* Row 2: Issue Tracker */}
        <div style={{ background: "var(--bg-primary)" }}>
          <IssueTracker />
        </div>
      </div>

      {/* Full-width sections */}
      <div className="flex flex-col gap-px" style={{ background: "var(--border)" }}>
        {/* Vessel + Airport tracking row */}
        <div id="section-vessels" className="grid grid-cols-2 gap-px max-lg:grid-cols-1" style={{ background: "var(--border)" }}>
          <VesselTracking />
          <AirportMonitor />
        </div>
        <div id="section-markets"><MarketSection /></div>
        <div id="section-analysis"><AiAnalysis /></div>
      </div>

      {/* Footer */}
      <footer
        className="flex justify-between items-center px-6 py-2.5 border-t"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="font-mono text-[0.8rem] tracking-[0.5px]" style={{ color: "var(--text-muted)" }}>
          {t("footer.system")}
        </span>
        <span className="font-mono text-[0.8rem] tracking-[0.5px]" style={{ color: "var(--text-muted)" }}>
          {t("footer.sources")}
        </span>
      </footer>
    </main>
  );
}
