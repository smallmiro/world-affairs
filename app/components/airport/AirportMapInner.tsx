"use client";

import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import { Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { AirportMapData } from "../../lib/airport-data";

const CONFLICT_ZONES = [
  { center: [15.5, 44.0] as [number, number], radius: 200000, color: "#ef4444", label: "Yemen", labelPos: [14.5, 44.0] as [number, number] },
  { center: [27.0, 52.0] as [number, number], radius: 150000, color: "#f59e0b", label: "Iran Exercise", labelPos: [28.0, 52.0] as [number, number] },
  { center: [33.5, 44.0] as [number, number], radius: 180000, color: "#ef4444", label: "Iraq/Syria", labelPos: [34.5, 44.0] as [number, number] },
  { center: [26.5, 56.3] as [number, number], radius: 50000, color: "#f59e0b", label: "Hormuz", labelPos: [26.0, 57.0] as [number, number] },
];

function aircraftIcon(cls: string, rotation: number) {
  const color = cls === "ek" ? "#f59e0b" : cls === "conflict-zone" ? "#ef4444" : "#94a3b8";
  return L.divIcon({
    className: "",
    html: `<div style="font-size:20px;color:${color};transform:rotate(${rotation}deg);filter:drop-shadow(0 0 6px ${color}80);line-height:1">✈</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function labelIcon(text: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="font-family:monospace;font-size:9px;color:${color};text-shadow:0 0 6px ${color}80;white-space:nowrap">${text}</div>`,
    iconSize: [80, 14],
    iconAnchor: [40, 7],
  });
}

interface AirportMapInnerProps {
  mapData: AirportMapData;
}

export default function AirportMapInner({ mapData }: AirportMapInnerProps) {
  const dxbIcon = L.divIcon({
    className: "",
    html: `<div style="font-family:monospace;font-size:11px;font-weight:bold;color:#f59e0b;text-shadow:0 0 10px rgba(245,158,11,0.8)">DXB</div>`,
    iconSize: [30, 14],
    iconAnchor: [15, 7],
  });

  return (
    <MapContainer
      center={[25.25, 50.0]}
      zoom={5}
      style={{ height: "100%", width: "100%", background: "#0a0e17" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" />
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png" opacity={0.4} />

      {/* DXB marker */}
      <Marker position={[25.253, 55.365]} icon={dxbIcon} interactive={false} />

      {/* Approach zones */}
      <Circle
        center={[25.253, 55.365]}
        radius={60000}
        pathOptions={{ color: "#f59e0b", fillOpacity: 0, weight: 1, dashArray: "4 4" }}
      />
      <Circle
        center={[25.253, 55.365]}
        radius={150000}
        pathOptions={{ color: "#06b6d4", fillOpacity: 0, weight: 1, dashArray: "6 6", opacity: 0.4 }}
      />

      {/* Conflict zones */}
      {CONFLICT_ZONES.map((zone) => (
        <Circle
          key={zone.label}
          center={zone.center}
          radius={zone.radius}
          pathOptions={{
            color: zone.color,
            fillColor: zone.color,
            fillOpacity: 0.08,
            weight: 1,
            dashArray: "4 4",
          }}
        />
      ))}
      {CONFLICT_ZONES.map((zone) => (
        <Marker key={`label-${zone.label}`} position={zone.labelPos} icon={labelIcon(zone.label, zone.color)} interactive={false} />
      ))}

      {/* Flight paths */}
      {mapData.flightPaths.map((fp, i) => (
        <Polyline
          key={i}
          positions={[[25.253, 55.365], fp.dest]}
          pathOptions={{
            color: fp.color,
            weight: 1,
            opacity: 0.2,
            dashArray: fp.dashArray ?? "6 6",
          }}
        />
      ))}

      {/* Aircraft markers */}
      {mapData.aircraft.map((ac) => (
        <Marker key={ac.flightLabel} position={[ac.lat, ac.lng]} icon={aircraftIcon(ac.cls, ac.rotation)}>
          <Popup>
            <div style={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
              <div style={{ fontWeight: "bold", color: ac.cls === "ek" ? "#f59e0b" : "#94a3b8", marginBottom: 2 }}>
                {ac.flightLabel}
              </div>
              <div style={{ fontSize: "0.6rem", color: "#94a3b8" }}>{ac.altLabel}</div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
