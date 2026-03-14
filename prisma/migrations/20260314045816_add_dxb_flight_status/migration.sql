-- CreateTable
CREATE TABLE "DxbFlightStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flightCode" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "scheduled" TEXT NOT NULL,
    "actual" TEXT NOT NULL,
    "terminal" TEXT NOT NULL,
    "gate" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "DxbFlightStatus_direction_collectedAt_idx" ON "DxbFlightStatus"("direction", "collectedAt");

-- CreateIndex
CREATE INDEX "DxbFlightStatus_flightCode_collectedAt_idx" ON "DxbFlightStatus"("flightCode", "collectedAt");
