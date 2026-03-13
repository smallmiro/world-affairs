import type { GeoRepositoryPort } from "../../domain/geopolitics/ports";
import type { GeoEvent } from "../../domain/geopolitics/entities";
import type { GeoEventType, Language, Severity } from "../../shared/types";
import type { PrismaClient } from "../../generated/prisma/client";

function langTitle(lang: Language): "titleEn" | "titleKo" | "titleJa" {
  return lang === "en" ? "titleEn" : lang === "ko" ? "titleKo" : "titleJa";
}

function langDesc(lang: Language): "descEn" | "descKo" | "descJa" {
  return lang === "en" ? "descEn" : lang === "ko" ? "descKo" : "descJa";
}

function toGeoEvent(row: Record<string, unknown>): GeoEvent {
  const countries = typeof row.countries === "string"
    ? JSON.parse(row.countries as string)
    : [];

  return {
    id: row.id as string,
    source: row.source as string,
    eventType: row.eventType as GeoEvent["eventType"],
    title: {
      en: row.titleEn as string,
      ko: row.titleKo as string,
      ja: row.titleJa as string,
    },
    description:
      row.descEn || row.descKo || row.descJa
        ? {
            en: (row.descEn as string) ?? "",
            ko: (row.descKo as string) ?? "",
            ja: (row.descJa as string) ?? "",
          }
        : null,
    countries,
    lat: (row.lat as number) ?? null,
    lon: (row.lon as number) ?? null,
    severity: row.severity as Severity,
    goldsteinScale: (row.goldsteinScale as number) ?? null,
    eventDate: new Date(row.eventDate as string | Date),
    collectedAt: new Date(row.collectedAt as string | Date),
  };
}

export class GeoRepository implements GeoRepositoryPort {
  constructor(private prisma: PrismaClient) {}

  async save(events: GeoEvent[]): Promise<void> {
    await this.prisma.$transaction(
      events.map((event) =>
        this.prisma.geoEvent.create({
          data: {
            id: event.id,
            source: event.source,
            eventType: event.eventType,
            titleEn: event.title.en,
            titleKo: event.title.ko,
            titleJa: event.title.ja,
            descEn: event.description?.en ?? null,
            descKo: event.description?.ko ?? null,
            descJa: event.description?.ja ?? null,
            countries: JSON.stringify(event.countries),
            lat: event.lat,
            lon: event.lon,
            severity: event.severity,
            goldsteinScale: event.goldsteinScale,
            eventDate: event.eventDate,
          },
        }),
      ),
    );
  }

  async findLatest(limit: number, lang: Language): Promise<GeoEvent[]> {
    const rows = await this.prisma.geoEvent.findMany({
      orderBy: { eventDate: "desc" },
      take: limit,
    });
    return rows.map((r) => toGeoEvent(r as unknown as Record<string, unknown>));
  }

  async findBySeverity(severity: Severity, lang: Language, limit: number): Promise<GeoEvent[]> {
    const rows = await this.prisma.geoEvent.findMany({
      where: { severity },
      orderBy: { eventDate: "desc" },
      take: limit,
    });
    return rows.map((r) => toGeoEvent(r as unknown as Record<string, unknown>));
  }

  async findByEventType(eventType: GeoEventType, lang: Language, limit: number): Promise<GeoEvent[]> {
    const rows = await this.prisma.geoEvent.findMany({
      where: { eventType },
      orderBy: { eventDate: "desc" },
      take: limit,
    });
    return rows.map((r) => toGeoEvent(r as unknown as Record<string, unknown>));
  }
}
