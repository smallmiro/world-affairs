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

  it("should have prisma schema", () => {
    expect(fs.existsSync(path.join(root, "prisma/schema.prisma"))).toBe(true);
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
      fs.existsSync(path.join(root, "src/generated/prisma")),
    ).toBe(true);
  });
});

describe("Hexagonal architecture structure (src/)", () => {
  it("should have domain layer with 5 bounded contexts", () => {
    for (const ctx of ["news", "market", "vessel", "geopolitics", "analysis"]) {
      expect(fs.existsSync(path.join(root, `src/domain/${ctx}/entities.ts`))).toBe(true);
      expect(fs.existsSync(path.join(root, `src/domain/${ctx}/ports.ts`))).toBe(true);
      expect(fs.existsSync(path.join(root, `src/domain/${ctx}/index.ts`))).toBe(true);
    }
  });

  it("should have shared types", () => {
    expect(fs.existsSync(path.join(root, "src/shared/types.ts"))).toBe(true);
  });

  it("should have adapters layer", () => {
    expect(fs.existsSync(path.join(root, "src/adapters/collectors"))).toBe(true);
    expect(fs.existsSync(path.join(root, "src/adapters/repositories"))).toBe(true);
    expect(fs.existsSync(path.join(root, "src/adapters/ai"))).toBe(true);
  });

  it("should have usecases layer", () => {
    expect(fs.existsSync(path.join(root, "src/usecases"))).toBe(true);
  });

  it("should have infrastructure layer with prisma singleton", () => {
    expect(fs.existsSync(path.join(root, "src/infrastructure/prisma.ts"))).toBe(true);
  });

  it("should have batch scheduler", () => {
    expect(fs.existsSync(path.join(root, "src/batch/scheduler.ts"))).toBe(true);
  });

  it("should have shared directory", () => {
    expect(fs.existsSync(path.join(root, "src/shared"))).toBe(true);
  });
});
