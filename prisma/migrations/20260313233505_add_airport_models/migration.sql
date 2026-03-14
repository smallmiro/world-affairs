-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleKo" TEXT NOT NULL DEFAULT '',
    "titleJa" TEXT NOT NULL DEFAULT '',
    "summaryEn" TEXT,
    "summaryKo" TEXT,
    "summaryJa" TEXT,
    "category" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "imageUrl" TEXT,
    "publishedAt" DATETIME NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "MarketSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "symbol" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "change" REAL NOT NULL,
    "changePct" REAL NOT NULL,
    "open" REAL,
    "high" REAL,
    "low" REAL,
    "volume" REAL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "timestamp" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vessel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mmsi" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "flag" TEXT NOT NULL,
    "tonnage" REAL
);

-- CreateTable
CREATE TABLE "VesselPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vesselId" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL,
    "speed" REAL,
    "course" REAL,
    "zone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'normal',
    "timestamp" DATETIME NOT NULL,
    CONSTRAINT "VesselPosition_vesselId_fkey" FOREIGN KEY ("vesselId") REFERENCES "Vessel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeoEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleKo" TEXT NOT NULL DEFAULT '',
    "titleJa" TEXT NOT NULL DEFAULT '',
    "descEn" TEXT,
    "descKo" TEXT,
    "descJa" TEXT,
    "countries" TEXT NOT NULL,
    "lat" REAL,
    "lon" REAL,
    "severity" TEXT NOT NULL,
    "goldsteinScale" REAL,
    "eventDate" DATETIME NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AirportStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "light" TEXT NOT NULL,
    "totalFlights" INTEGER NOT NULL,
    "onTimePercent" REAL NOT NULL,
    "delayedFlights" INTEGER NOT NULL,
    "cancelledFlights" INTEGER NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FlightPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "icao24" TEXT NOT NULL,
    "callsign" TEXT NOT NULL,
    "lat" REAL NOT NULL,
    "lon" REAL NOT NULL,
    "altitude" REAL NOT NULL,
    "speed" REAL NOT NULL,
    "heading" REAL NOT NULL,
    "onGround" BOOLEAN NOT NULL,
    "airlineIata" TEXT,
    "aircraftClass" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AirportEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleKo" TEXT NOT NULL DEFAULT '',
    "titleJa" TEXT NOT NULL DEFAULT '',
    "descEn" TEXT,
    "descKo" TEXT,
    "descJa" TEXT,
    "eventType" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AirlineOps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "airlineIata" TEXT NOT NULL,
    "airlineName" TEXT NOT NULL,
    "totalFlights" INTEGER NOT NULL,
    "onTimePercent" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "EmiratesRoute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "destination" TEXT NOT NULL,
    "flightCode" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AiAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "type" TEXT NOT NULL,
    "resultEn" TEXT NOT NULL,
    "resultKo" TEXT NOT NULL DEFAULT '',
    "resultJa" TEXT NOT NULL DEFAULT '',
    "sentiment" REAL,
    "model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Article_region_publishedAt_idx" ON "Article"("region", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_category_publishedAt_idx" ON "Article"("category", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_severity_publishedAt_idx" ON "Article"("severity", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Article_sourceId_source_key" ON "Article"("sourceId", "source");

-- CreateIndex
CREATE INDEX "MarketSnapshot_type_timestamp_idx" ON "MarketSnapshot"("type", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "MarketSnapshot_symbol_timestamp_key" ON "MarketSnapshot"("symbol", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "Vessel_mmsi_key" ON "Vessel"("mmsi");

-- CreateIndex
CREATE INDEX "VesselPosition_vesselId_timestamp_idx" ON "VesselPosition"("vesselId", "timestamp");

-- CreateIndex
CREATE INDEX "VesselPosition_zone_timestamp_idx" ON "VesselPosition"("zone", "timestamp");

-- CreateIndex
CREATE INDEX "GeoEvent_eventType_eventDate_idx" ON "GeoEvent"("eventType", "eventDate");

-- CreateIndex
CREATE INDEX "GeoEvent_severity_eventDate_idx" ON "GeoEvent"("severity", "eventDate");

-- CreateIndex
CREATE INDEX "AirportStatus_collectedAt_idx" ON "AirportStatus"("collectedAt");

-- CreateIndex
CREATE INDEX "FlightPosition_collectedAt_idx" ON "FlightPosition"("collectedAt");

-- CreateIndex
CREATE INDEX "FlightPosition_aircraftClass_collectedAt_idx" ON "FlightPosition"("aircraftClass", "collectedAt");

-- CreateIndex
CREATE INDEX "AirportEvent_eventType_eventDate_idx" ON "AirportEvent"("eventType", "eventDate");

-- CreateIndex
CREATE INDEX "AirportEvent_eventDate_idx" ON "AirportEvent"("eventDate");

-- CreateIndex
CREATE UNIQUE INDEX "AirportEvent_sourceId_source_key" ON "AirportEvent"("sourceId", "source");

-- CreateIndex
CREATE INDEX "AirlineOps_collectedAt_idx" ON "AirlineOps"("collectedAt");

-- CreateIndex
CREATE INDEX "AirlineOps_airlineIata_collectedAt_idx" ON "AirlineOps"("airlineIata", "collectedAt");

-- CreateIndex
CREATE INDEX "EmiratesRoute_collectedAt_idx" ON "EmiratesRoute"("collectedAt");

-- CreateIndex
CREATE INDEX "EmiratesRoute_destination_collectedAt_idx" ON "EmiratesRoute"("destination", "collectedAt");

-- CreateIndex
CREATE INDEX "AiAnalysis_targetType_targetId_idx" ON "AiAnalysis"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AiAnalysis_type_createdAt_idx" ON "AiAnalysis"("type", "createdAt");
