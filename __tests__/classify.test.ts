import { describe, it, expect } from "vitest";
import { classifyCategory, classifyRegionFromText, countryToRegion } from "../src/shared/classify";

describe("classifyCategory", () => {
  it("should classify military content", () => {
    expect(classifyCategory("US military deploys troops to NATO border")).toBe("military");
  });

  it("should classify diplomacy content", () => {
    expect(classifyCategory("Foreign ministers meet at UN summit for peace talks")).toBe("diplomacy");
  });

  it("should classify economy content", () => {
    expect(classifyCategory("New trade tariff on semiconductor exports")).toBe("economy");
  });

  it("should classify environment content", () => {
    expect(classifyCategory("COP29 climate summit discusses carbon emissions")).toBe("environment");
  });

  it("should classify human rights content", () => {
    expect(classifyCategory("Refugees flee persecution amid humanitarian crisis")).toBe("human_rights");
  });

  it("should classify tech content", () => {
    expect(classifyCategory("Semiconductor chip ban targets AI technology")).toBe("tech");
  });

  it("should return null for unclassifiable text", () => {
    expect(classifyCategory("Lorem ipsum dolor sit amet")).toBeNull();
  });
});

describe("classifyRegionFromText", () => {
  it("should detect middle-east region", () => {
    expect(classifyRegionFromText("Iran launches missiles near Hormuz strait")).toBe("middle-east");
  });

  it("should detect east-asia region", () => {
    expect(classifyRegionFromText("China-Taiwan tensions escalate")).toBe("east-asia");
  });

  it("should detect europe region", () => {
    expect(classifyRegionFromText("Ukraine conflict continues as NATO responds")).toBe("europe");
  });

  it("should detect africa region", () => {
    expect(classifyRegionFromText("Sudan civil war displaces millions")).toBe("africa");
  });

  it("should return null for unidentifiable region", () => {
    expect(classifyRegionFromText("Lorem ipsum dolor sit amet")).toBeNull();
  });
});

describe("countryToRegion", () => {
  it("should map country codes to regions", () => {
    expect(countryToRegion("US")).toBe("north-america");
    expect(countryToRegion("CN")).toBe("east-asia");
    expect(countryToRegion("IR")).toBe("middle-east");
    expect(countryToRegion("UA")).toBe("europe");
    expect(countryToRegion("BR")).toBe("south-america");
    expect(countryToRegion("AU")).toBe("oceania");
    expect(countryToRegion("IN")).toBe("south-asia");
    expect(countryToRegion("KZ")).toBe("central-asia");
    expect(countryToRegion("VN")).toBe("southeast-asia");
    expect(countryToRegion("NG")).toBe("africa");
  });

  it("should be case-insensitive", () => {
    expect(countryToRegion("us")).toBe("north-america");
  });

  it("should return null for unknown code", () => {
    expect(countryToRegion("XX")).toBeNull();
  });
});
