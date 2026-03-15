"use client";

interface IntraDayChartProps {
  open: number;
  high: number;
  low: number;
  price: number;
  direction: "up" | "down" | "flat";
  width?: number | string;
  height?: number;
}

const COLORS = {
  up: "#ef4444",
  down: "#3b82f6",
  flat: "#94a3b8",
} as const;

function scaleY(value: number, min: number, max: number, yMin: number, yMax: number): number {
  if (max === min) return (yMin + yMax) / 2;
  return yMax - ((value - min) / (max - min)) * (yMax - yMin);
}

export default function IntraDayChart({
  open,
  high,
  low,
  price,
  direction,
  width = "100%",
  height = 36,
}: IntraDayChartProps) {
  const color = COLORS[direction];

  const allValues = [open, high, low, price];
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);

  const yMin = 8;
  const yMax = 64;
  const xPoints = [0, 53, 107, 160];
  const values = [open, low, high, price];

  const points = values.map((v, i) => ({
    x: xPoints[i],
    y: scaleY(v, dataMin, dataMax, yMin, yMax),
  }));

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `${polylinePoints} 160,${yMax} 0,${yMax}`;

  const gradientId = `intraday-grad-${direction}-${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 72"
      preserveAspectRatio="none"
      style={{ display: "block", maxWidth: "100%", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[14, 36, 58].map((y) => (
        <line
          key={y}
          x1={0}
          y1={y}
          x2={160}
          y2={y}
          stroke="var(--border)"
          strokeWidth={0.5}
          opacity={0.3}
        />
      ))}

      {/* Gradient fill area */}
      <polygon points={areaPoints} fill={`url(#${gradientId})`} />

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pulsing dot at current price */}
      <circle cx={points[3].x} cy={points[3].y} r={2.5} fill={color}>
        <animate
          attributeName="opacity"
          values="1;0.3;1"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}
