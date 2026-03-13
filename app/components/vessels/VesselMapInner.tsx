"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { VesselWithPosition } from "../../lib/types";

const TYPE_COLORS: Record<string, string> = {
  tanker_crude: "#f59e0b",
  tanker_product: "#f59e0b",
  lpg: "#06b6d4",
  lng: "#06b6d4",
};

const TYPE_LABELS: Record<string, string> = {
  tanker_crude: "원유 유조선",
  tanker_product: "석유제품 유조선",
  lpg: "LPG선",
  lng: "LNG선",
};

interface VesselMapInnerProps {
  vessels: VesselWithPosition[];
}

export default function VesselMapInner({ vessels }: VesselMapInnerProps) {
  return (
    <MapContainer
      center={[22, 50]}
      zoom={4}
      style={{ height: 340, width: "100%", background: "#0a0e17" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {vessels
        .filter((v) => v.latestPosition)
        .map((v) => {
          const pos = v.latestPosition!;
          const color = pos.status !== "normal" ? "#ef4444" : (TYPE_COLORS[v.type] ?? "#f59e0b");
          return (
            <CircleMarker
              key={v.id}
              center={[pos.lat, pos.lon]}
              radius={pos.status !== "normal" ? 6 : 4}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.8,
                weight: 1,
              }}
            >
              <Popup>
                <div style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                  <div style={{ fontWeight: "bold", color, marginBottom: 4 }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                    {TYPE_LABELS[v.type] ?? v.type} · {v.flag}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                    {pos.speed ?? 0} kn · {pos.zone ?? "—"}
                  </div>
                  {pos.status !== "normal" && (
                    <div style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: 2 }}>
                      STATUS: {pos.status.toUpperCase()}
                    </div>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
