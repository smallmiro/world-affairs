import { hashString } from "../../shared/classify";

export interface DxbMediaArticle {
  sourceId: string;
  url: string;
  title: string;
  date: Date;
}

const MEDIA_URL = "https://media.dubaiairports.ae";

export async function collectDxbMedia(): Promise<DxbMediaArticle[]> {
  const headers = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" };

  try {
    const res = await fetch(MEDIA_URL, { headers });
    if (!res.ok) {
      console.warn(`[DXB Media] HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    return parseMediaHtml(html);
  } catch (error) {
    console.warn("[DXB Media] Scrape failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

function parseMediaHtml(html: string): DxbMediaArticle[] {
  const articles: DxbMediaArticle[] = [];

  // Match article blocks: <a href="/slug/"> ... <h2>Title</h2> ... <time datetime="...">
  const linkPattern = /<a[^>]+href="(\/[^"]+\/)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1];
    const block = match[2];

    // Extract title from h2/h3
    const titleMatch = block.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    // Skip non-operational / marketing content
    if (!isOperational(title)) continue;

    // Extract date from <time datetime="...">
    const timeMatch = block.match(/<time[^>]+datetime="([^"]+)"/i);
    const date = timeMatch ? new Date(timeMatch[1]) : new Date();

    const url = `${MEDIA_URL}${href}`;
    articles.push({
      sourceId: hashString(url),
      url,
      title,
      date,
    });
  }

  return articles;
}

const OPERATIONAL_KEYWORDS = [
  "operation", "airspace", "closure", "flight", "delay", "cancel",
  "runway", "notam", "divert", "suspend", "weather", "fog",
  "storm", "traffic", "capacity", "passenger", "terminal",
  "regional", "update", "advisory", "notice",
];

function isOperational(title: string): boolean {
  const lower = title.toLowerCase();
  return OPERATIONAL_KEYWORDS.some((kw) => lower.includes(kw));
}
