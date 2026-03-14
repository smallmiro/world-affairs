"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { VesselWithPosition } from "../../lib/types";

const TYPE_LABELS: Record<string, string> = {
  tanker_crude: "원유 유조선",
  tanker_product: "석유제품 유조선",
  lpg: "LPG선",
  lng: "LNG선",
};

function vesselMarkerClass(type: string, isAnomaly: boolean): string {
  if (isAnomaly) return "vessel-marker reroute";
  if (type === "lpg" || type === "lng") return "vessel-marker lpg";
  return "vessel-marker";
}

function vesselIcon(type: string, isAnomaly: boolean, course: number | null): L.DivIcon {
  const cls = vesselMarkerClass(type, isAnomaly);
  const rotation = course ?? 0;
  return L.divIcon({
    className: "",
    html: `<div class="${cls}" style="transform: rotate(${rotation}deg);"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

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
          const isAnomaly = pos.status !== "normal";
          const color = isAnomaly ? "#ef4444" : (v.type === "lpg" || v.type === "lng") ? "#06b6d4" : "#f59e0b";
          return (
            <Marker
              key={v.id}
              position={[pos.lat, pos.lon]}
              icon={vesselIcon(v.type, isAnomaly, pos.course)}
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
                  {isAnomaly && (
                    <div style={{ fontSize: "0.65rem", color: "#ef4444", marginTop: 2 }}>
                      STATUS: {pos.status.toUpperCase()}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
