import type { ReactNode } from "react";

interface SectionHeaderProps {
  title: string;
  accentColor?: string;
  controls?: ReactNode;
}

export default function SectionHeader({ title, accentColor = "var(--accent-cyan)", controls }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2"
          style={{ background: accentColor, clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)" }}
        />
        <h2 className="font-mono text-[1.05rem] font-semibold tracking-[2px] uppercase" style={{ color: "var(--text-secondary)" }}>
          {title}
        </h2>
      </div>
      {controls}
    </div>
  );
}
