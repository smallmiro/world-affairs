const PUBLISH_URL = process.env.SSE_PUBLISH_URL ?? "http://localhost:3000/api/sse/publish";
const INTERNAL_KEY = process.env.INTERNAL_API_KEY ?? "world-affairs-internal";

export async function publishToSSE(channel: string, data: unknown): Promise<void> {
  try {
    await fetch(PUBLISH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_KEY,
      },
      body: JSON.stringify({ channel, data }),
    });
  } catch {
    // SSE publish is best-effort — web server may not be running
  }
}
