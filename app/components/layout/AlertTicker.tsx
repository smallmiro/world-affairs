"use client";

import { useNews } from "../../hooks/use-news";
import { useGeoEvents } from "../../hooks/use-geo-events";
import { useLanguage } from "../../lib/language-context";
import { useT } from "../../hooks/use-t";
import { getTranslatedText } from "../../lib/display-mappers";

interface AlertItem {
  level: string;
  text: string;
}

export default function AlertTicker() {
  const { lang } = useLanguage();
  const t = useT();
  const { data: news } = useNews({ limit: 50 });
  const { data: events } = useGeoEvents({ limit: 50 });

  const alerts: AlertItem[] = [];

  if (news) {
    for (const article of news) {
      if (article.severity === "critical") {
        alerts.push({ level: t("alert.urgent"), text: getTranslatedText(article.title, lang) });
      }
    }
  }

  if (events) {
    for (const event of events) {
      if (event.severity === "critical") {
        alerts.push({ level: t("alert.breaking"), text: getTranslatedText(event.title, lang) });
      } else if (event.severity === "high") {
        alerts.push({ level: t("alert.caution"), text: getTranslatedText(event.title, lang) });
      }
    }
  }

  const displayAlerts =
    alerts.length > 0
      ? alerts.slice(0, 10)
      : [{ level: "INFO", text: t("alert.noAlert") }];

  const doubled = [...displayAlerts, ...displayAlerts];

  return (
    <div
      className="flex items-center gap-3 px-6 py-1.5 overflow-hidden border-b"
      style={{
        background: alerts.length > 0 ? "var(--accent-red-dim)" : "var(--bg-secondary)",
        borderColor: alerts.length > 0 ? "rgba(239,68,68,0.2)" : "var(--border)",
      }}
    >
      <span
        className="font-mono text-[0.75rem] md:text-[0.65rem] font-bold tracking-[2px] uppercase whitespace-nowrap"
        style={{
          color: alerts.length > 0 ? "var(--accent-red)" : "var(--text-muted)",
          animation: alerts.length > 0 ? "blink-label 1s step-end infinite" : undefined,
        }}
      >
        ALERT
      </span>
      <div className="flex-1 overflow-hidden">
        <div
          className="flex gap-20 whitespace-nowrap"
          style={{ animation: "scroll-ticker 30s linear infinite" }}
        >
          {doubled.map((alert, i) => (
            <span key={i} className="font-mono text-[0.75rem] md:text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
              <strong style={{ color: "var(--accent-red)", fontWeight: 600 }}>[{alert.level}]</strong>{" "}
              {alert.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
