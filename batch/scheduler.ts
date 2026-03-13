import cron from "node-cron";

// Batch scheduler entry point
// Collectors will be registered here in future issues

console.log("Batch scheduler started");

// Example: run every hour (disabled by default)
// cron.schedule("0 * * * *", async () => {
//   console.log("Running scheduled collection...");
// });

// Keep process alive
cron.schedule("*/30 * * * *", () => {
  console.log(`[${new Date().toISOString()}] Scheduler heartbeat`);
});
