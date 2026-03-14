import WebSocketWs from "ws";
import type { VesselCollectorPort } from "../../domain/vessel/ports";
import type { RawAisMessage } from "../../domain/vessel/entities";

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
      UserID: number;
      Sog: number;
      Cog: number;
      TrueHeading: number;
      Latitude: number;
      Longitude: number;
    };
    ShipStaticData?: {
      Type: number;
      Name: string;
      ImoNumber: number;
      Dimension: { A: number; B: number; C: number; D: number };
      CallSign: string;
    };
  };
}

const RECONNECT_DELAY_MS = 5000;
const WS_URL = "wss://stream.aisstream.io/v0/stream";

export class AisStreamCollector implements VesselCollectorPort {
  private ws: WebSocketWs | null = null;
  private messageHandler: ((message: RawAisMessage) => void) | null = null;
  private apiKey: string;
  private shouldReconnect = true;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.AISSTREAM_API_KEY ?? "";
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      throw new Error("AISStream API key is required. Set AISSTREAM_API_KEY env variable.");
    }

    this.shouldReconnect = true;
    return this.doConnect();
  }

  private doConnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocketWs(WS_URL);

      this.ws.on("open", () => {
        const subscribeMsg = {
          APIkey: this.apiKey,
          BoundingBoxes: [
            // Worldwide — Middle East filtering done in process-vessel.ts
            [[-90, -180], [90, 180]],
          ],
          FiltersShipMMSI: [],
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        };
        this.ws!.send(JSON.stringify(subscribeMsg));
        console.log("[AIS] WebSocket connected. Subscribed to Middle East region.");
        resolve();
      });

      this.ws.on("error", (error) => {
        console.error("[AIS] WebSocket error:", error);
        if (!this.ws || this.ws.readyState === WebSocketWs.CONNECTING) {
          reject(new Error("AISStream WebSocket connection failed"));
        }
      });

      this.ws.on("close", () => {
        console.warn("[AIS] WebSocket closed.");
        if (this.shouldReconnect) {
          console.log(`[AIS] Reconnecting in ${RECONNECT_DELAY_MS / 1000}s...`);
          setTimeout(() => {
            if (this.shouldReconnect) {
              this.doConnect().catch((e) =>
                console.error("[AIS] Reconnect failed:", e instanceof Error ? e.message : e),
              );
            }
          }, RECONNECT_DELAY_MS);
        }
      });

      this.ws.on("message", (buf: Buffer) => {
        if (!this.messageHandler) return;

        try {
          const data: AisStreamMessage = JSON.parse(buf.toString());
          const meta = data.MetaData;
          const posReport = data.Message.PositionReport;
          const staticData = data.Message.ShipStaticData;

          const lat = posReport?.Latitude ?? meta.latitude;
          const lon = posReport?.Longitude ?? meta.longitude;
          if (lat === 0 && lon === 0) return;

          const msg: RawAisMessage = {
            mmsi: String(meta.MMSI),
            name: (staticData?.Name ?? meta.ShipName ?? "").trim(),
            shipType: staticData?.Type ?? 0,
            flag: "",
            tonnage: null,
            lat,
            lon,
            speed: posReport?.Sog ?? null,
            course: posReport?.Cog ?? null,
            timestamp: new Date(meta.time_utc),
          };

          this.messageHandler(msg);
        } catch (error) {
          console.warn("[AIS] Message parse error:", error instanceof Error ? error.message : error);
        }
      });
    });
  }

  async disconnect(): Promise<void> {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onMessage(handler: (message: RawAisMessage) => void): void {
    this.messageHandler = handler;
  }
}
