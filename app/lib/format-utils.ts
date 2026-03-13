export function formatPrice(price: number, currency?: string): string {
  if (currency === "KRW") {
    return price.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  }
  if (currency === "USD") {
    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }
  return price.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function formatChangePct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function getDirection(change: number): "up" | "down" | "flat" {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

export function getChangeColor(direction: "up" | "down" | "flat"): string {
  if (direction === "up") return "var(--accent-red)";
  if (direction === "down") return "var(--accent-blue)";
  return "var(--text-muted)";
}

export function getDirectionArrow(direction: "up" | "down" | "flat"): string {
  if (direction === "up") return "\u25B2";
  if (direction === "down") return "\u25BC";
  return "";
}
