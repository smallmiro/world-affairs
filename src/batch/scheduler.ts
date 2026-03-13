import cron from "node-cron";

// Batch scheduler entry point
// Collectors will be registered here in future issues

console.log("Batch scheduler started");

// Keep process alive
cron.schedule("*/30 * * * *", () => {
  console.log(`[${new Date().toISOString()}] Scheduler heartbeat`);
});
