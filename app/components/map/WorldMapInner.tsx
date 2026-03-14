"use client";

import { MapContainer, TileLayer, CircleMarker, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { GeoEvent } from "../../lib/types";
import type { FlightPositionResponse } from "../../lib/api-client";
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

// Aircraft colors: Emirates=red, Etihad=amber, others=gray
const AIRLINE_COLORS: Record<string, string> = {
  UAE: "#ef4444", // Emirates — red
  ETD: "#f59e0b", // Etihad — amber/yellow
};

const AIRLINE_NAMES: Record<string, string> = {
  UAE: "Emirates", FDB: "flydubai", ETD: "Etihad", QTR: "Qatar Airways",
  SVA: "Saudia", ABY: "Air Arabia", GFA: "Gulf Air", KAL: "Korean Air",
  SIA: "Singapore Airlines", DLH: "Lufthansa", BAW: "British Airways",
  THY: "Turkish Airlines", PIA: "PIA", OMA: "Oman Air",
};

function aircraftIcon(callsign: string, heading: number): L.DivIcon {
  const prefix = callsign.trim().slice(0, 3).toUpperCase();
  const color = AIRLINE_COLORS[prefix] ?? "#64748b";
  return L.divIcon({
    className: "",
    html: `<div style="font-size:16px;color:${color};transform:rotate(${heading}deg);filter:drop-shadow(0 0 4px ${color}80);line-height:1">✈</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

interface WorldMapInnerProps {
  events: GeoEvent[];
  flights?: FlightPositionResponse[];
}

export default function WorldMapInner({ events, flights = [] }: WorldMapInnerProps) {
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

      {/* GeoEvents */}
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

      {/* Aircraft positions */}
      {flights
        .filter((f) => !f.onGround)
        .map((f) => {
          const prefix = f.callsign.trim().slice(0, 3).toUpperCase();
          const airlineName = AIRLINE_NAMES[prefix] ?? prefix;
          const color = AIRLINE_COLORS[prefix] ?? "#64748b";
          return (
            <Marker
              key={f.icao24 + f.callsign}
              position={[f.lat, f.lon]}
              icon={aircraftIcon(f.callsign, f.heading)}
            >
              <Popup>
                <div style={{ fontFamily: "monospace", fontSize: "0.7rem", background: "#0f1420", padding: 6, minWidth: 120 }}>
                  <div style={{ fontWeight: "bold", color, marginBottom: 3, fontSize: "0.8rem" }}>
                    ✈ {f.callsign.trim()}
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "#e2e8f0", marginBottom: 2 }}>
                    {airlineName}
                  </div>
                  {(f.depAirport || f.arrAirport) && (
                    <div style={{ fontSize: "0.6rem", color: "#06b6d4", marginBottom: 2 }}>
                      {f.depAirport ?? "?"} → {f.arrAirport ?? "?"}
                      {f.flightStatus && <span style={{ marginLeft: 4, color: f.flightStatus === "delayed" ? "#ef4444" : "#22c55e" }}>{f.flightStatus}</span>}
                    </div>
                  )}
                  <div style={{ fontSize: "0.55rem", color: "#94a3b8" }}>
                    FL{Math.round(f.altitude / 100)} · {Math.round(f.speed)}kt
                    {f.depTime && <span> · DEP {f.depTime}</span>}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </MapContainer>
  );
}
