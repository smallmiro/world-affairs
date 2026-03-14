"use client";

import { MapContainer, TileLayer, CircleMarker, Circle, Marker, Popup } from "react-leaflet";
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

// Tension zones overlay
const TENSION_ZONES: { center: [number, number]; radius: number; color: string; label: string; labelPos: [number, number]; type: string; desc: string }[] = [
  // Conflict zones (red)
  { center: [15.5, 44.0], radius: 300000, color: "#ef4444", label: "Yemen/Houthi", labelPos: [13.5, 44.0], type: "분쟁구역",
    desc: "후티 반군의 홍해 선박 공격, 드론/미사일 위협. 국제 해상 운송 차질 및 에너지 공급망 리스크." },
  { center: [33.5, 44.0], radius: 250000, color: "#ef4444", label: "Iraq/Syria", labelPos: [35.5, 44.0], type: "분쟁구역",
    desc: "이라크·시리아 내전 잔존 분쟁. 이란 민병대 활동, 미군 기지 공격, 항공 경로 우회 원인." },
  { center: [50.4, 30.5], radius: 300000, color: "#ef4444", label: "Ukraine", labelPos: [52.0, 30.5], type: "분쟁구역",
    desc: "러시아-우크라이나 전쟁. 유럽 에너지 안보 위협, 곡물 수출 차질, NATO 긴장 고조." },
  { center: [31.5, 34.5], radius: 150000, color: "#ef4444", label: "Gaza", labelPos: [30.0, 34.5], type: "분쟁구역",
    desc: "이스라엘-하마스 분쟁. 인도적 위기, 중동 전역 긴장 확산, 레바논·이란 연쇄 갈등." },
  // Caution zones (amber)
  { center: [32.0, 53.0], radius: 400000, color: "#f59e0b", label: "Iran", labelPos: [34.5, 53.0], type: "경계구역",
    desc: "미국-이란 군사 대치. 핵 프로그램 갈등, 걸프 해역 군사 훈련, 호르무즈 해협 봉쇄 위협." },
  { center: [26.5, 56.3], radius: 80000, color: "#f59e0b", label: "Hormuz", labelPos: [25.5, 57.5], type: "경계구역",
    desc: "세계 원유 20% 통과 해협. 이란 해군 활동, 유조선 나포 위험, 에너지 시장 핵심 병목." },
  { center: [12.5, 43.5], radius: 100000, color: "#f59e0b", label: "Bab el-Mandeb", labelPos: [11.5, 45.0], type: "경계구역",
    desc: "홍해-아덴만 연결 해협. 후티 반군 공격 영향권, 수에즈 운하 대체 항로 병목." },
  { center: [38.5, 127.0], radius: 200000, color: "#f59e0b", label: "Korean Peninsula", labelPos: [40.0, 129.0], type: "경계구역",
    desc: "북한 핵·미사일 위협. 남북 군사 긴장, 동북아 안보 불안정, 미·중 전략 경쟁 축." },
  { center: [23.5, 121.0], radius: 200000, color: "#f59e0b", label: "Taiwan Strait", labelPos: [21.5, 122.0], type: "경계구역",
    desc: "중국-대만 군사 대치. 미·중 패권 경쟁 핵심, 반도체 공급망 리스크, 인도-태평양 안보." },
  // Safe/stable zones (green)
  { center: [25.25, 55.36], radius: 150000, color: "#22c55e", label: "UAE/DXB", labelPos: [23.5, 55.5], type: "안전구역",
    desc: "UAE 두바이. 중동 항공·물류 허브, 안정적 경제 환경, 외교적 중립 기조 유지." },
  { center: [25.3, 51.5], radius: 100000, color: "#22c55e", label: "Qatar/DOH", labelPos: [24.0, 52.5], type: "안전구역",
    desc: "카타르 도하. LNG 수출 강국, 중재 외교 역할, 걸프 안정화 기여." },
];

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
      center={[32, 52]}
      zoom={4}
      style={{ height: 420, width: "100%", background: "#1a1b26" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

      {/* Conflict / Caution / Safe zones */}
      {TENSION_ZONES.map((zone) => (
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
        >
          <Popup>
            <div style={{ fontFamily: "monospace", fontSize: "0.7rem", minWidth: 200, background: "#16161e", padding: 8, borderRadius: 2 }}>
              <div style={{ fontWeight: "bold", color: zone.color, marginBottom: 4, fontSize: "0.8rem" }}>
                {zone.label}
              </div>
              <div style={{
                fontSize: "0.75rem", fontWeight: "bold", letterSpacing: "0.5px",
                color: zone.color, background: `${zone.color}20`, padding: "2px 6px",
                display: "inline-block", marginBottom: 6,
              }}>
                {zone.type}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#e2e8f0", lineHeight: 1.5 }}>
                {zone.desc}
              </div>
            </div>
          </Popup>
        </Circle>
      ))}
      {TENSION_ZONES.map((zone) => (
        <Marker
          key={`label-${zone.label}`}
          position={zone.labelPos}
          icon={L.divIcon({
            className: "",
            html: `<div style="font-family:monospace;font-size:11px;color:${zone.color};text-shadow:0 0 4px ${zone.color}80;white-space:nowrap">${zone.label}</div>`,
            iconSize: [80, 12],
            iconAnchor: [40, 6],
          })}
          interactive={false}
        />
      ))}

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
                <div style={{ fontFamily: "monospace", fontSize: "0.7rem", background: "#16161e", padding: 6, minWidth: 120 }}>
                  <div style={{ fontWeight: "bold", color, marginBottom: 3, fontSize: "0.8rem" }}>
                    ✈ {f.callsign.trim()}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#e2e8f0", marginBottom: 2 }}>
                    {airlineName}
                  </div>
                  {(f.depAirport || f.arrAirport) && (
                    <div style={{ fontSize: "0.8rem", color: "#06b6d4", marginBottom: 2 }}>
                      {f.depAirport ?? "?"} → {f.arrAirport ?? "?"}
                      {f.flightStatus && <span style={{ marginLeft: 4, color: f.flightStatus === "delayed" ? "#ef4444" : "#22c55e" }}>{f.flightStatus}</span>}
                    </div>
                  )}
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
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
