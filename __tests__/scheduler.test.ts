import { describe, it, expect, vi } from "vitest";
import cron from "node-cron";

describe("scheduler configuration", () => {
  it("should validate cron expressions", () => {
    // News: every 15 minutes
    expect(cron.validate("*/15 * * * *")).toBe(true);
    // Market: every 15 minutes
    expect(cron.validate("*/15 * * * *")).toBe(true);
    // Geopolitics: every 30 minutes
    expect(cron.validate("*/30 * * * *")).toBe(true);
    // Daily briefing: 06:00 KST (21:00 UTC)
    expect(cron.validate("0 21 * * *")).toBe(true);
    // Translation: every hour
    expect(cron.validate("0 * * * *")).toBe(true);
  });

  it("should reject invalid cron expressions", () => {
    expect(cron.validate("invalid")).toBe(false);
    expect(cron.validate("")).toBe(false);
  });
});
