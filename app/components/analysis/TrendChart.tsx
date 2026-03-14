"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { TrendDataPoint } from "../../lib/trend-aggregation";

const LINES = [
  { key: "conflict" as const, color: "#ef4444" },
  { key: "protest" as const, color: "#f59e0b" },
  { key: "diplomacy" as const, color: "#06b6d4" },
  { key: "other" as const, color: "#3b82f6" },
];

interface TrendChartProps {
  data: TrendDataPoint[];
}

export default function TrendChart({ data }: TrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{
            fontFamily: "monospace",
            fontSize: "0.55rem",
            fill: "var(--text-muted)",
          }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{
            fontFamily: "monospace",
            fontSize: "0.55rem",
            fill: "var(--text-muted)",
          }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            fontFamily: "monospace",
            fontSize: "0.65rem",
            color: "var(--text-primary)",
          }}
          itemStyle={{ color: "var(--text-secondary)" }}
          labelStyle={{
            fontFamily: "monospace",
            fontSize: "0.6rem",
            color: "var(--text-muted)",
            marginBottom: 4,
          }}
        />
        {LINES.map((line) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            stroke={line.color}
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
