import type { TimelineEvent, TimelineEventType } from "../../lib/airport-data";

const DOT_STYLES: Record<TimelineEventType, string> = {
  conflict: "#ef4444",
  ops: "#f59e0b",
  normal: "#22c55e",
  info: "#06b6d4",
};

const TAG_STYLES: Record<TimelineEventType, { color: string; bg: string }> = {
  conflict: { color: "var(--accent-red)", bg: "var(--accent-red-dim)" },
  ops: { color: "var(--accent-amber)", bg: "var(--accent-amber-dim)" },
  normal: { color: "var(--accent-green)", bg: "var(--accent-green-dim)" },
  info: { color: "var(--accent-cyan)", bg: "var(--accent-cyan-dim)" },
};

interface AirportTimelineProps {
  events: TimelineEvent[];
}

export default function AirportTimeline({ events }: AirportTimelineProps) {
  return (
    <div>
      <div
        className="font-mono text-[0.58rem] tracking-[1.5px] uppercase mb-2"
        style={{ color: "var(--text-muted)", paddingLeft: 10 }}
      >
        7일 타임라인
      </div>
      <div
        className="overflow-y-auto py-1"
        style={{ maxHeight: 420, scrollbarWidth: "thin", scrollbarColor: "var(--border-active) transparent" }}
      >
        {events.map((event, i) => (
          <div
            key={event.date}
            className="grid items-start relative"
            style={{ gridTemplateColumns: "52px 20px 1fr", minHeight: 52 }}
          >
            {/* Date */}
            <div
              className="text-right pr-2 pt-1.5 font-mono text-[0.58rem] leading-tight"
              style={{ color: event.isToday ? "var(--accent-cyan)" : "var(--text-muted)" }}
            >
              {event.date}
              <span
                className="block text-[0.48rem]"
                style={{ opacity: event.isToday ? 0.8 : 0.6 }}
              >
                {event.dayLabel}
              </span>
            </div>

            {/* Stem + Dot */}
            <div className="flex flex-col items-center relative">
              {/* Vertical line */}
              <div
                className="absolute top-0 bottom-0 w-px"
                style={{ background: "var(--border)", left: "50%", transform: "translateX(-50%)" }}
              />
              {/* Dot */}
              <div
                className="w-2 h-2 rounded-full mt-2 relative z-10 shrink-0"
                style={{
                  background: DOT_STYLES[event.dotType],
                  boxShadow: `0 0 6px ${DOT_STYLES[event.dotType]}80`,
                }}
              />
            </div>

            {/* Card */}
            <div
              className="my-1 ml-1.5 px-2.5 py-1.5 text-[0.6rem] leading-[1.45] border"
              style={{
                background: event.isToday ? "rgba(6,182,212,0.04)" : "var(--bg-secondary)",
                borderColor: event.isToday ? "rgba(6,182,212,0.25)" : "var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              {event.entries.map((entry, j) => (
                <div key={j} className={j > 0 ? "mt-1" : ""}>
                  {entry.tags.map((tag, k) => {
                    const s = TAG_STYLES[tag.type];
                    return (
                      <span
                        key={k}
                        className="font-mono text-[0.46rem] font-semibold tracking-[0.5px] inline-block mr-1 align-middle"
                        style={{ color: s.color, background: s.bg, padding: "1px 4px" }}
                      >
                        {tag.label}
                      </span>
                    );
                  })}
                  {entry.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
