"use client";

import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoEvent } from "../../lib/types";
import { useLanguage } from "../../lib/language-context";
import { getTranslatedText, mapSeverity } from "../../lib/display-mappers";

const SEVERITY_MARKER_COLORS: Record<string, string> = {
  critical: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

function pulseIcon(severity: string): L.DivIcon {
  const cls = severity === "warning" ? "pulse-marker amber" : "pulse-marker";
  return L.divIcon({ className: cls, iconSize: [14, 14], iconAnchor: [7, 7] });
}

interface WorldMapInnerProps {
  events: GeoEvent[];
}

export default function WorldMapInner({ events }: WorldMapInnerProps) {
  const { lang } = useLanguage();

  return (
    <MapContainer
      center={[25, 45]}
      zoom={2}
      style={{ height: 370, width: "100%", background: "#0a0e17" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      {events
        .filter((e) => e.lat !== null && e.lon !== null)
        .map((event) => {
          const displaySeverity = mapSeverity(event.severity);
          const color = SEVERITY_MARKER_COLORS[displaySeverity] ?? "#3b82f6";

          if (displaySeverity === "critical") {
            return (
              <Marker
                key={event.id}
                position={[event.lat!, event.lon!]}
                icon={pulseIcon(displaySeverity)}
              >
                <Popup>
                  <div style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                    <div style={{ fontWeight: "bold", color, marginBottom: 4 }}>
                      {getTranslatedText(event.title, lang)}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                      {event.countries.join(", ")} · {event.eventType}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          }

          return (
            <CircleMarker
              key={event.id}
              center={[event.lat!, event.lon!]}
              radius={4}
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
                    {getTranslatedText(event.title, lang)}
                  </div>
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8" }}>
                    {event.countries.join(", ")} · {event.eventType}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
