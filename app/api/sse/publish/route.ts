import { NextResponse, type NextRequest } from "next/server";
import { pubsub } from "../../../../src/infrastructure/pubsub";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("x-internal-key");
  const expectedKey = process.env.INTERNAL_API_KEY ?? "world-affairs-internal";

  if (authHeader !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { channel, data } = body as { channel: string; data: unknown };

  if (!channel || !data) {
    return NextResponse.json({ error: "channel and data are required" }, { status: 400 });
  }

  const subscribers = pubsub.subscriberCount(channel);
  pubsub.publish(channel, data);

  return NextResponse.json({ ok: true, channel, subscribers });
}
