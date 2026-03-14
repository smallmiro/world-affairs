import Parser from "rss-parser";
import type { NewsCollectorPort } from "../../domain/news/ports";
import type { RawArticle } from "../../domain/news/entities";
import type { CollectionResult } from "../../shared/types";
import { classifyCategory, classifyRegionFromText, hashString } from "../../shared/classify";

interface RssFeed {
  name: string;
  url: string;
}

const RSS_FEEDS: RssFeed[] = [
  { name: "bbc-world", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { name: "bbc-middleeast", url: "https://feeds.bbci.co.uk/news/world/middle_east/rss.xml" },
  { name: "aljazeera", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { name: "nbc-world", url: "https://feeds.nbcnews.com/nbcnews/public/world" },
  { name: "reuters-world", url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best" },
];

export class RssCollector implements NewsCollectorPort {
  private parser = new Parser();
  private feeds: RssFeed[];

  constructor(feeds?: RssFeed[]) {
    this.feeds = feeds ?? RSS_FEEDS;
  }

  async collect(): Promise<CollectionResult<RawArticle[]>> {
    const allArticles: RawArticle[] = [];

    for (const feed of this.feeds) {
      try {
        const parsed = await this.parser.parseURL(feed.url);
        const articles = (parsed.items ?? []).map((item) => {
          const text = `${item.title ?? ""} ${item.contentSnippet ?? ""} ${item.content ?? ""}`;
          const guid = item.guid ?? item.link ?? item.title ?? "";

          return {
            sourceId: hashString(guid),
            source: feed.name,
            url: item.link ?? "",
            title: item.title ?? "",
            summary: item.contentSnippet?.slice(0, 500) ?? null,
            category: classifyCategory(text),
            region: classifyRegionFromText(text),
            imageUrl: null,
            publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
            originalLanguage: "en" as const,
          } satisfies RawArticle;
        });

        allArticles.push(...articles);
      } catch (error) {
        console.error(`RSS feed error [${feed.name}]:`, error);
      }
    }

    return {
      data: allArticles,
      collectedAt: new Date(),
      source: "rss",
    };
  }
}
