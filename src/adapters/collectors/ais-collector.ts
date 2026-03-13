import type { VesselCollectorPort } from "../../domain/vessel/ports";
import type { RawAisMessage } from "../../domain/vessel/entities";
import { classifyShipType } from "../../shared/classify";

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
          const vesselType = classifyShipType(shipType);
          if (!vesselType) return;

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
        } catch (error) {
          console.warn("AIS message parse error:", error instanceof Error ? error.message : error);
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
