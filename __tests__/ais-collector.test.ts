import { describe, it, expect } from "vitest";
import { classifyZone, classifyShipType } from "../src/adapters/collectors/ais-collector";

describe("classifyZone", () => {
  it("should detect Strait of Hormuz", () => {
    expect(classifyZone(26.5, 56.2)).toBe("hormuz");
  });

  it("should detect Bab el-Mandeb", () => {
    expect(classifyZone(12.5, 43.3)).toBe("bab_el_mandeb");
  });

  it("should detect Suez Canal", () => {
    expect(classifyZone(30.0, 32.5)).toBe("suez");
  });

  it("should detect Persian Gulf", () => {
    expect(classifyZone(27.0, 50.0)).toBe("persian_gulf");
  });

  it("should detect Red Sea", () => {
    expect(classifyZone(20.0, 38.0)).toBe("red_sea");
  });

  it("should detect Gulf of Aden", () => {
    expect(classifyZone(12.0, 47.0)).toBe("gulf_of_aden");
  });

  it("should return null for outside zones", () => {
    expect(classifyZone(35.0, 0.0)).toBeNull();
  });
});

describe("classifyShipType", () => {
  it("should classify crude tanker (type 81)", () => {
    expect(classifyShipType(81)).toBe("tanker_crude");
  });

  it("should classify LPG carrier (type 82)", () => {
    expect(classifyShipType(82)).toBe("lpg");
  });

  it("should classify LNG carrier (type 84)", () => {
    expect(classifyShipType(84)).toBe("lng");
  });

  it("should classify product tanker (type 80)", () => {
    expect(classifyShipType(80)).toBe("tanker_product");
  });

  it("should classify product tanker (type 85-89)", () => {
    expect(classifyShipType(85)).toBe("tanker_product");
    expect(classifyShipType(89)).toBe("tanker_product");
  });

  it("should return null for non-tanker types", () => {
    expect(classifyShipType(70)).toBeNull(); // cargo
    expect(classifyShipType(30)).toBeNull(); // fishing
    expect(classifyShipType(0)).toBeNull();
  });
});
