import { execFile } from "child_process";
import { promisify } from "util";
import { hashString } from "../../shared/classify";

const execFileAsync = promisify(execFile);

export interface DxbMediaArticle {
  sourceId: string;
  url: string;
  title: string;
  date: Date;
}

const MEDIA_URL = "https://media.dubaiairports.ae";

export async function collectDxbMedia(): Promise<DxbMediaArticle[]> {
  try {
    // Use curl because Node.js fetch times out on this host (DNS/routing issue)
    const { stdout } = await execFileAsync("curl", [
      "-s", "-L", "--max-time", "15",
      "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      MEDIA_URL,
    ]);

    if (!stdout || stdout.length < 100) {
      console.warn("[DXB Media] Empty response from curl");
      return [];
    }

    return parseMediaHtml(stdout);
  } catch (error) {
    console.warn("[DXB Media] Scrape failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

function parseMediaHtml(html: string): DxbMediaArticle[] {
  const articles: DxbMediaArticle[] = [];

  // Structure: <a class="pp-tile-item-container" href="https://media.dubaiairports.ae/slug/">
  //   <h3 class="pp-tile-item-heading">Title</h3>
  //   <time datetime="...">
  const linkPattern = /<a[^>]+class="pp-tile-item-container"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkPattern.exec(html)) !== null) {
    const fullUrl = match[1];
    const block = match[2];

    // Extract title from h3 (pp-tile-item-heading)
    const titleMatch = block.match(/<h[23][^>]*>([^<]+)<\/h[23]>/i);
    if (!titleMatch) continue;
    const title = titleMatch[1].trim();

    // Skip non-operational / marketing content
    if (!isOperational(title)) continue;

    // Extract date from <time datetime="..."> or <span class="pp-tile-item-date">
    const timeMatch = block.match(/<time[^>]+datetime="([^"]+)"/i);
    const dateSpanMatch = block.match(/(\d{1,2}\s+\w+\s+\d{4})/);
    let date: Date;
    if (timeMatch) {
      date = new Date(timeMatch[1]);
    } else if (dateSpanMatch) {
      date = new Date(dateSpanMatch[1]);
    } else {
      date = new Date();
    }

    const url = fullUrl.startsWith("http") ? fullUrl : `${MEDIA_URL}${fullUrl}`;
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
