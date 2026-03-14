export interface AirportStatus {
  light: "green" | "amber" | "red";
  label: string;
  runways: string;
  weather: string;
}

export type TimelineEventType = "conflict" | "ops" | "normal" | "info";

export interface TimelineTag {
  type: TimelineEventType;
  label: string;
}

export interface TimelineEvent {
  date: string;
  dayLabel: string;
  isToday: boolean;
  dotType: TimelineEventType;
  entries: { tags: TimelineTag[]; text: string }[];
}

import type { AirlineOpsStatus } from "../../src/shared/types";

/** @deprecated Use AirlineOpsStatus from src/shared/types instead */
export type AirlineStatusType = AirlineOpsStatus;

export interface Airline {
  code: string;
  name: string;
  flights: number;
  onTime: number;
  status: AirlineOpsStatus;
}

export type RouteStatus = "open" | "diverted" | "suspended";

export interface EKRoute {
  dest: string;
  flightCode: string;
  status: RouteStatus;
}

export interface Aircraft {
  lat: number;
  lng: number;
  rotation: number;
  flightLabel: string;
  altLabel: string;
  cls: "ek" | "other" | "conflict-zone";
}

export interface FlightPath {
  dest: [number, number];
  color: string;
  dashArray?: string;
}

export interface AirportMapData {
  aircraft: Aircraft[];
  flightPaths: FlightPath[];
}

export const AIRPORT_STATUS: AirportStatus = {
  light: "green",
  label: "OPERATIONAL",
  runways: "RWY 12L/30R · 12R/30L ACTIVE",
  weather: "VIS 10km+ · WIND 320°/12kt",
};

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    date: "3/14",
    dayLabel: "TODAY",
    isToday: true,
    dotType: "normal",
    entries: [
      { tags: [{ type: "normal", label: "OPS" }], text: "DXB 전 활주로 정상운영" },
      { tags: [{ type: "conflict", label: "WATCH" }], text: "이란 훈련 지속 · 항로 감시중" },
    ],
  },
  {
    date: "3/13",
    dayLabel: "THU",
    isToday: false,
    dotType: "info",
    entries: [{ tags: [{ type: "info", label: "INTEL" }], text: "UAE 방공체계 경계 격상" }],
  },
  {
    date: "3/12",
    dayLabel: "WED",
    isToday: false,
    dotType: "ops",
    entries: [
      { tags: [{ type: "ops", label: "DELAY" }], text: "IKA행 평균 1.5H 지연" },
      { tags: [{ type: "normal", label: "SAFE" }], text: "DXB 동측 항로 정상화" },
    ],
  },
  {
    date: "3/11",
    dayLabel: "TUE",
    isToday: false,
    dotType: "conflict",
    entries: [{ tags: [{ type: "conflict", label: "STRIKE" }], text: "이란 IRGC 걸프만 미사일 시험" }],
  },
  {
    date: "3/10",
    dayLabel: "MON",
    isToday: false,
    dotType: "ops",
    entries: [
      { tags: [{ type: "ops", label: "REROUTE" }], text: "DXB-유럽 노선 남측 우회" },
      { tags: [{ type: "info", label: "EK" }], text: "TLV/BEY 노선 중단 발표" },
    ],
  },
  {
    date: "3/9",
    dayLabel: "SUN",
    isToday: false,
    dotType: "conflict",
    entries: [{ tags: [{ type: "conflict", label: "ALERT" }], text: "이란 해군 호르무즈 훈련 개시" }],
  },
  {
    date: "3/8",
    dayLabel: "SAT",
    isToday: false,
    dotType: "conflict",
    entries: [
      { tags: [{ type: "conflict", label: "STRIKE" }], text: "예멘 후티, 홍해 드론 공격" },
      { tags: [{ type: "ops", label: "NOTAM" }], text: "DXB 남측 항로 제한" },
    ],
  },
];

export const AIRLINES: Airline[] = [
  { code: "EK", name: "에미레이트 (EK)", flights: 142, onTime: 98, status: "normal" },
  { code: "FZ", name: "플라이두바이 (FZ)", flights: 86, onTime: 95, status: "normal" },
  { code: "QR", name: "카타르항공 (QR)", flights: 38, onTime: 82, status: "delays" },
  { code: "KE", name: "대한항공 (KE)", flights: 4, onTime: 100, status: "normal" },
  { code: "LH", name: "루프트한자 (LH)", flights: 6, onTime: 78, status: "delays" },
  { code: "IR", name: "이란항공 (IR)", flights: 2, onTime: 50, status: "disrupted" },
];

export const EK_ROUTES: EKRoute[] = [
  { dest: "ICN", flightCode: "EK322", status: "open" },
  { dest: "LHR", flightCode: "EK001", status: "open" },
  { dest: "NRT", flightCode: "EK318", status: "open" },
  { dest: "SIN", flightCode: "EK354", status: "open" },
  { dest: "JFK", flightCode: "EK201", status: "open" },
  { dest: "CDG", flightCode: "EK073", status: "open" },
  { dest: "IKA", flightCode: "EK971", status: "diverted" },
  { dest: "TLV", flightCode: "EK931", status: "suspended" },
  { dest: "BEY", flightCode: "EK957", status: "suspended" },
  { dest: "DME", flightCode: "EK131", status: "open" },
  { dest: "BKK", flightCode: "EK384", status: "open" },
  { dest: "SYD", flightCode: "EK414", status: "open" },
];

export const AIRPORT_MAP_DATA: AirportMapData = {
  aircraft: [
    { lat: 26.1, lng: 54.8, rotation: 210, flightLabel: "EK302 ICN", altLabel: "FL380", cls: "ek" },
    { lat: 24.8, lng: 56.2, rotation: 45, flightLabel: "EK412 SYD", altLabel: "FL350", cls: "ek" },
    { lat: 25.8, lng: 53.5, rotation: 90, flightLabel: "EK001 LHR", altLabel: "FL400", cls: "ek" },
    { lat: 24.2, lng: 55.8, rotation: 340, flightLabel: "EK201 JFK", altLabel: "FL390", cls: "ek" },
    { lat: 25.5, lng: 55.1, rotation: 180, flightLabel: "EK318 NRT", altLabel: "FL360", cls: "ek" },
    { lat: 26.5, lng: 56.5, rotation: 270, flightLabel: "EK073 CDG", altLabel: "FL370", cls: "ek" },
    { lat: 25.0, lng: 54.0, rotation: 120, flightLabel: "EK384 BKK", altLabel: "FL340", cls: "ek" },
    { lat: 25.9, lng: 55.8, rotation: 60, flightLabel: "EK131 DME", altLabel: "FL380", cls: "ek" },
    { lat: 23.8, lng: 54.5, rotation: 15, flightLabel: "QR102", altLabel: "FL350", cls: "other" },
    { lat: 26.8, lng: 54.2, rotation: 200, flightLabel: "LH630", altLabel: "FL370", cls: "other" },
    { lat: 25.1, lng: 57.0, rotation: 280, flightLabel: "KE952", altLabel: "FL380", cls: "other" },
    { lat: 24.5, lng: 53.8, rotation: 90, flightLabel: "FZ201", altLabel: "FL280", cls: "other" },
    { lat: 27.2, lng: 55.5, rotation: 170, flightLabel: "FZ445", altLabel: "FL320", cls: "other" },
    { lat: 24.0, lng: 56.5, rotation: 350, flightLabel: "9W540", altLabel: "FL340", cls: "other" },
    { lat: 26.3, lng: 53.0, rotation: 110, flightLabel: "FZ877", altLabel: "FL300", cls: "other" },
    { lat: 25.7, lng: 56.8, rotation: 230, flightLabel: "SQ492", altLabel: "FL390", cls: "other" },
  ],
  flightPaths: [
    { dest: [37.5, 127.0], color: "#f59e0b" },
    { dest: [51.47, -0.46], color: "#f59e0b" },
    { dest: [35.76, 140.39], color: "#f59e0b" },
    { dest: [40.64, -73.78], color: "#f59e0b", dashArray: "8 4" },
    { dest: [49.0, 2.55], color: "#f59e0b" },
    { dest: [13.68, 100.75], color: "#f59e0b" },
  ],
};
