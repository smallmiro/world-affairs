import type { VesselCollectorPort } from "../../domain/vessel/ports";
import type { RawAisMessage } from "../../domain/vessel/entities";
import type { MaritimeZone } from "../../shared/types";

interface AisStreamMessage {
  MessageType: string;
  MetaData: {
    MMSI: number;
    ShipName: string;
    latitude: number;
    longitude: number;
    time_utc: string;
  };
  Message: {
    PositionReport?: {
      Sog: number;
      Cog: number;
      TrueHeading: number;
    };
    ShipStaticData?: {
      Type: number;
      Name: string;
      ImoNumber: number;
      Dimension: {
        A: number;
        B: number;
        C: number;
        D: number;
      };
      CallSign: string;
    };
  };
}

// Middle East maritime bounding boxes
const MARITIME_ZONES: { zone: MaritimeZone; bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number } }[] = [
  { zone: "hormuz", bounds: { minLat: 25.5, maxLat: 27.0, minLon: 55.5, maxLon: 57.0 } },
  { zone: "bab_el_mandeb", bounds: { minLat: 12.0, maxLat: 13.5, minLon: 43.0, maxLon: 44.0 } },
  { zone: "suez", bounds: { minLat: 29.5, maxLat: 31.5, minLon: 32.0, maxLon: 33.0 } },
  { zone: "persian_gulf", bounds: { minLat: 24.0, maxLat: 30.0, minLon: 48.0, maxLon: 56.5 } },
  { zone: "red_sea", bounds: { minLat: 13.5, maxLat: 29.5, minLon: 32.5, maxLon: 43.5 } },
  { zone: "gulf_of_aden", bounds: { minLat: 10.5, maxLat: 15.0, minLon: 43.0, maxLon: 51.0 } },
];

export function classifyZone(lat: number, lon: number): MaritimeZone | null {
  for (const { zone, bounds } of MARITIME_ZONES) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon) {
      return zone;
    }
  }
  return null;
}

// AIS ship type codes → our VesselType
// See: https://coast.noaa.gov/data/marinecadastre/ais/VesselTypeCodes2018.pdf
const TANKER_CODES = new Set([80, 81, 82, 83, 84, 85, 86, 87, 88, 89]);
const LPG_CODE = 82;
const LNG_CODE = 84;

export function classifyShipType(aisType: number): "tanker_crude" | "tanker_product" | "lpg" | "lng" | null {
  if (aisType === LPG_CODE) return "lpg";
  if (aisType === LNG_CODE) return "lng";
  if (aisType === 81) return "tanker_crude";
  if (TANKER_CODES.has(aisType)) return "tanker_product";
  return null;
}

export class AisStreamCollector implements VesselCollectorPort {
  private ws: WebSocket | null = null;
  private messageHandler: ((message: RawAisMessage) => void) | null = null;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.AISSTREAM_API_KEY ?? "";
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error("AISStream API key is required. Set AISSTREAM_API_KEY env variable.");
    }

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

      this.ws.onopen = () => {
        const subscribeMsg = {
          Apikey: this.apiKey,
          BoundingBoxes: [
            // Middle East maritime region: from Suez to Strait of Hormuz
            [[10.0, 32.0], [31.5, 57.0]],
          ],
          FiltersShipMMSI: [],
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        };
        this.ws!.send(JSON.stringify(subscribeMsg));
        resolve();
      };

      this.ws.onerror = (error) => {
        reject(new Error(`AISStream WebSocket error: ${error}`));
      };

      this.ws.onmessage = (event) => {
        if (!this.messageHandler) return;

        try {
          const data: AisStreamMessage = JSON.parse(String(event.data));
          const meta = data.MetaData;
          const posReport = data.Message.PositionReport;
          const shipType = data.Message.ShipStaticData?.Type ?? 0;

          // Only process tankers/LPG/LNG
          if (!classifyShipType(shipType) && !posReport) return;

          const raw: RawAisMessage = {
            mmsi: String(meta.MMSI),
            name: meta.ShipName.trim(),
            shipType,
            flag: "",
            tonnage: null,
            lat: meta.latitude,
            lon: meta.longitude,
            speed: posReport?.Sog ?? null,
            course: posReport?.Cog ?? null,
            timestamp: new Date(meta.time_utc),
          };

          this.messageHandler(raw);
        } catch {
          // Skip malformed messages
        }
      };
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: (message: RawAisMessage) => void): void {
    this.messageHandler = handler;
  }
}
