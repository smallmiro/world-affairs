import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.resolve(__dirname, "..");

describe("Project scaffolding", () => {
  it("should have app directory with layout and page", () => {
    expect(fs.existsSync(path.join(root, "app/layout.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(root, "app/page.tsx"))).toBe(true);
  });

  it("should have api directory", () => {
    expect(fs.existsSync(path.join(root, "app/api"))).toBe(true);
  });

  it("should have batch directory with scheduler", () => {
    expect(fs.existsSync(path.join(root, "batch/scheduler.ts"))).toBe(true);
    expect(fs.existsSync(path.join(root, "batch/collectors"))).toBe(true);
  });

  it("should have prisma schema", () => {
    expect(fs.existsSync(path.join(root, "prisma/schema.prisma"))).toBe(true);
  });

  it("should have lib/prisma.ts client singleton", () => {
    expect(fs.existsSync(path.join(root, "lib/prisma.ts"))).toBe(true);
  });

  it("should have src/domain directory", () => {
    expect(fs.existsSync(path.join(root, "src/domain"))).toBe(true);
  });

  it("should have db directory with .gitkeep", () => {
    expect(fs.existsSync(path.join(root, "db/.gitkeep"))).toBe(true);
  });

  it("should have ecosystem.config.js for pm2", () => {
    expect(fs.existsSync(path.join(root, "ecosystem.config.js"))).toBe(true);
  });

  it("should have .env.example", () => {
    expect(fs.existsSync(path.join(root, ".env.example"))).toBe(true);
  });

  it("should have generated Prisma client", () => {
    expect(
      fs.existsSync(path.join(root, "app/generated/prisma")),
    ).toBe(true);
  });
});
