const COLORS: Record<string, string> = {
  green: "var(--accent-green)",
  amber: "var(--accent-amber)",
  red: "var(--accent-red)",
};

interface StatusLightProps {
  color: "green" | "amber" | "red";
  size?: number;
  pulse?: boolean;
  glow?: boolean;
}

export default function StatusLight({ color, size = 8, pulse = true, glow = true }: StatusLightProps) {
  const bg = COLORS[color];
  return (
    <div
      className="rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: bg,
        boxShadow: glow ? `0 0 ${size}px ${bg}` : undefined,
        animation: pulse ? "pulse-dot 2s ease-in-out infinite" : undefined,
      }}
    />
  );
}
