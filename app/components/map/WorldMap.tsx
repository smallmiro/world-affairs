"use client";

import dynamic from "next/dynamic";
import { useGeoEvents } from "../../hooks/use-geo-events";
import SectionHeader from "../ui/SectionHeader";

const WorldMapInner = dynamic(() => import("./WorldMapInner"), { ssr: false });

export default function WorldMap() {
  const { data: events, isLoading } = useGeoEvents({ limit: 50 });

  return (
    <section
      className="p-5"
      style={{ animation: "fade-in-up 0.4s ease-out 0.05s both" }}
    >
      <div className="mb-4">
        <SectionHeader
          title="Global Tension Map"
          accentColor="var(--accent-cyan)"
          controls={
            <div className="flex gap-1">
              {["긴장도", "동맹", "무역", "분쟁"].map((label, i) => (
                <button
                  key={label}
                  className="font-mono text-[0.62rem] tracking-[0.5px] px-2 py-[3px] border cursor-pointer transition-all duration-150"
                  style={{
                    color: i === 0 ? "var(--accent-cyan)" : "var(--text-muted)",
                    borderColor: i === 0 ? "var(--accent-cyan)" : "var(--border)",
                    background: i === 0 ? "var(--accent-cyan-dim)" : "transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          }
        />
      </div>

      <div
        className="relative w-full border overflow-hidden"
        style={{ borderColor: "var(--border)", height: 370 }}
      >
        {isLoading ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ background: "#0a0e17" }}
          >
            <span className="font-mono text-[0.6rem] tracking-[2px]" style={{ color: "var(--text-muted)", opacity: 0.4 }}>
              LOADING MAP...
            </span>
          </div>
        ) : (
          <WorldMapInner events={events ?? []} />
        )}
      </div>
    </section>
  );
}
