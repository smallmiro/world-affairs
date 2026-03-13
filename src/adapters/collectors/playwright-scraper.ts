import { chromium, type Browser, type Page } from "playwright";
import * as cheerio from "cheerio";
import { createHash } from "crypto";
import type { NewsCollectorPort } from "../../domain/news/ports";
import type { RawArticle } from "../../domain/news/entities";
import type { CollectionResult } from "../../shared/types";
import { classifyCategory, classifyRegionFromText } from "../../shared/classify";
import type { SiteConfig } from "./scraper-selectors";
import { SCRAPER_CONFIGS } from "./scraper-selectors";

const USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

const MAX_RETRIES = 3;
const TIMEOUT_MS = 30_000;

function hashString(str: string): string {
  return createHash("sha256").update(str).digest("hex").slice(0, 16);
}

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function resolveUrl(href: string, baseUrl: string): string {
  if (href.startsWith("http")) return href;
  const base = new URL(baseUrl);
  return new URL(href, base.origin).toString();
}

export function parseArticlesFromHtml(
  html: string,
  config: SiteConfig,
): Omit<RawArticle, "publishedAt">[] {
  const $ = cheerio.load(html);
  const articles: Omit<RawArticle, "publishedAt">[] = [];

  $(config.selectors.articleList).each((_, el) => {
    const $el = $(el);
    const title = $el.find(config.selectors.title).first().text().trim();
    const linkEl = $el.find(config.selectors.link).first();
    const href = linkEl.attr("href") ?? "";
    const summary = config.selectors.summary
      ? $el.find(config.selectors.summary).first().text().trim() || null
      : null;
    const imageUrl = config.selectors.imageUrl
      ? $el.find(config.selectors.imageUrl).first().attr("src") ?? null
      : null;

    if (!title || !href) return;

    const url = resolveUrl(href, config.url);
    const text = `${title} ${summary ?? ""}`;

    articles.push({
      sourceId: hashString(url),
      source: config.name,
      url,
      title,
      summary,
      category: classifyCategory(text),
      region: classifyRegionFromText(text),
      imageUrl,
      originalLanguage: "en",
    });
  });

  return articles;
}

async function fetchWithRetry(
  browser: Browser,
  config: SiteConfig,
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const context = await browser.newContext({
      userAgent: randomUserAgent(),
    });
    const page = await context.newPage();

    try {
      await page.goto(config.url, {
        waitUntil: "domcontentloaded",
        timeout: TIMEOUT_MS,
      });

      if (config.waitFor) {
        await page.waitForSelector(config.waitFor, { timeout: TIMEOUT_MS });
      }

      // Small delay for JS rendering
      await page.waitForTimeout(2000);

      const html = await page.content();
      return html;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(
        `Scrape attempt ${attempt}/${MAX_RETRIES} failed for ${config.name}: ${lastError.message}`,
      );
    } finally {
      await context.close();
    }
  }

  throw new Error(
    `Failed to scrape ${config.name} after ${MAX_RETRIES} attempts: ${lastError?.message}`,
  );
}

export class PlaywrightScraper implements NewsCollectorPort {
  private configs: SiteConfig[];

  constructor(configs?: SiteConfig[]) {
    this.configs = configs ?? SCRAPER_CONFIGS;
  }

  async collect(): Promise<CollectionResult<RawArticle[]>> {
    const allArticles: RawArticle[] = [];
    const browser = await chromium.launch({ headless: true });

    try {
      for (const config of this.configs) {
        try {
          const html = await fetchWithRetry(browser, config);
          const parsed = parseArticlesFromHtml(html, config);
          const now = new Date();

          const articles: RawArticle[] = parsed.map((a) => ({
            ...a,
            publishedAt: now,
          }));

          allArticles.push(...articles);
        } catch (error) {
          console.error(
            `Scraper error [${config.name}]:`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    } finally {
      await browser.close();
    }

    return {
      data: allArticles,
      collectedAt: new Date(),
      source: "playwright",
    };
  }
}
