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

      <div className="p-2 md:p-3 lg:p-4 flex flex-col gap-3 md:gap-4">
        {/* Map + Issues (left) | News (right) */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] lg:grid-cols-[1fr_320px] gap-3 md:gap-4 items-start">
          <div className="flex flex-col gap-3 md:gap-4">
            <div className="card" id="section-map">
              <WorldMap />
            </div>
            <div className="card">
              <IssueTracker />
            </div>
          </div>
          <div className="card overflow-hidden lg:sticky lg:top-[60px]">
            <NewsFeed />
          </div>
        </div>

        {/* Vessel + Airport */}
        <div id="section-vessels" className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 items-stretch">
          <div className="card flex flex-col">
            <VesselTracking />
          </div>
          <div className="card flex flex-col">
            <AirportMonitor />
          </div>
        </div>

        {/* Markets */}
        <div className="card" id="section-markets">
          <MarketSection />
        </div>

        {/* Analysis */}
        <div className="card" id="section-analysis">
          <AiAnalysis />
        </div>
      </div>

      {/* Footer */}
      <footer
        className="flex flex-wrap justify-center md:justify-between items-center px-3 md:px-6 py-2.5 border-t text-center md:text-left gap-1"
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
