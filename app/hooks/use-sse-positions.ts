"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface SSEVesselPosition {
  mmsi: string;
  name: string;
  type: string;
  lat: number;
  lon: number;
  speed: number | null;
  course: number | null;
  timestamp: string;
}

export interface SSEFlightPosition {
  icao24: string;
  callsign: string;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  heading: number;
  onGround: boolean;
  aircraftClass: string;
}

export interface SSEPositions {
  vessels: SSEVesselPosition[];
  flights: SSEFlightPosition[];
  connected: boolean;
}

export function useSSEPositions(): SSEPositions {
  const [vessels, setVessels] = useState<SSEVesselPosition[]>([]);
  const [flights, setFlights] = useState<SSEFlightPosition[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  const handleVessels = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as SSEVesselPosition[];
      setVessels(data);
    } catch {
      // ignore malformed data
    }
  }, []);

  const handleFlights = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as SSEFlightPosition[];
      setFlights(data);
    } catch {
      // ignore malformed data
    }
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/sse/positions");
    eventSourceRef.current = es;

    es.addEventListener("vessels", handleVessels);
    es.addEventListener("flights", handleFlights);

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects
    };

    return () => {
      es.removeEventListener("vessels", handleVessels);
      es.removeEventListener("flights", handleFlights);
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [handleVessels, handleFlights]);

  return { vessels, flights, connected };
}
