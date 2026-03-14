import { pubsub } from "../../../../src/infrastructure/pubsub";
import { startPositionBroadcaster } from "../../../../src/infrastructure/position-broadcaster";

export const dynamic = "force-dynamic";

// Start broadcaster on first SSE connection (lazy init)
let broadcasterStarted = false;

export async function GET() {
  if (!broadcasterStarted) {
    startPositionBroadcaster();
    broadcasterStarted = true;
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Subscribe to channels
      const unsubVessels = pubsub.subscribe("vessels", (data) => send("vessels", data));
      const unsubFlights = pubsub.subscribe("flights", (data) => send("flights", data));

      // Heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(": heartbeat\n\n"));
      }, 30000);

      controller.enqueue(encoder.encode(": connected\n\n"));

      // Store cleanup refs for cancel
      (controller as unknown as Record<string, unknown>).__cleanup = () => {
        unsubVessels();
        unsubFlights();
        clearInterval(heartbeat);
      };
    },
    cancel(controller) {
      const cleanup = (controller as unknown as Record<string, () => void>)?.__cleanup;
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
