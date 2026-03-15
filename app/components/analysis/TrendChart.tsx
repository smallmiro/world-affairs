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
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{
            fontFamily: "monospace",
            fontSize: "0.75rem",
            fill: "var(--text-muted)",
          }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          tick={{
            fontFamily: "monospace",
            fontSize: "0.8rem",
            fill: "var(--text-muted)",
          }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={40}
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
            fontSize: "0.8rem",
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
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            label={{ position: "top", fontSize: "0.7rem", fill: "var(--text-muted)", fontFamily: "monospace" }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
