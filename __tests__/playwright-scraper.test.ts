import { describe, it, expect } from "vitest";
import { parseArticlesFromHtml } from "../src/adapters/collectors/playwright-scraper";
import type { SiteConfig } from "../src/adapters/collectors/scraper-selectors";

const MOCK_CNN_HTML = `
<html><body>
  <div data-component-name="card">
    <a href="/2026/03/13/world/ukraine-ceasefire-talks"><span class="container__headline-text">Ukraine ceasefire talks resume</span></a>
    <div class="container__description">Negotiations continue in Geneva</div>
  </div>
  <div data-component-name="card">
    <a href="https://edition.cnn.com/2026/03/13/world/iran-nuclear-deal"><span class="container__headline-text">Iran nuclear deal update</span></a>
    <div class="container__description">New sanctions discussed</div>
  </div>
  <div data-component-name="card">
    <a href=""><span class="container__headline-text"></span></a>
  </div>
</body></html>
`;

const CNN_CONFIG: SiteConfig = {
  name: "cnn",
  url: "https://edition.cnn.com/world",
  selectors: {
    articleList: "[data-component-name='card']",
    title: ".container__headline-text",
    link: "a[href]",
    summary: ".container__description",
  },
};

const MOCK_REUTERS_HTML = `
<html><body>
  <div data-testid="MediaStoryCard">
    <a href="/world/middle-east/iran-tensions-2026"><h3 data-testid="Heading">Iran tensions escalate in Middle East</h3></a>
    <p>Military exercises near Hormuz strait</p>
  </div>
  <div data-testid="MediaStoryCard">
    <a href="/world/europe/eu-trade-policy"><h3 data-testid="Heading">EU trade policy shift</h3></a>
    <p>European leaders discuss new tariff framework</p>
  </div>
</body></html>
`;

const REUTERS_CONFIG: SiteConfig = {
  name: "reuters",
  url: "https://www.reuters.com/world/",
  selectors: {
    articleList: "[data-testid='MediaStoryCard']",
    title: "[data-testid='Heading']",
    link: "a[href]",
    summary: "p",
  },
};

const MOCK_ECONOMIST_HTML = `
<html><body>
  <div data-test-id="Article">
    <a href="/international/2026/03/13/china-military-buildup"><h3>China military buildup raises concerns</h3></a>
    <p class="article__description">Asia-Pacific tensions increase as naval deployments expand</p>
  </div>
</body></html>
`;

const ECONOMIST_CONFIG: SiteConfig = {
  name: "economist",
  url: "https://www.economist.com/international",
  selectors: {
    articleList: "[data-test-id='Article']",
    title: "h3",
    link: "a[href]",
    summary: "p.article__description",
  },
};

describe("parseArticlesFromHtml", () => {
  it("should parse CNN articles from HTML", () => {
    const articles = parseArticlesFromHtml(MOCK_CNN_HTML, CNN_CONFIG);

    expect(articles).toHaveLength(2); // 3rd card has empty title/link, should be skipped
    expect(articles[0].title).toBe("Ukraine ceasefire talks resume");
    expect(articles[0].source).toBe("cnn");
    expect(articles[0].url).toBe("https://edition.cnn.com/2026/03/13/world/ukraine-ceasefire-talks");
    expect(articles[0].summary).toBe("Negotiations continue in Geneva");
  });

  it("should resolve relative URLs correctly", () => {
    const articles = parseArticlesFromHtml(MOCK_CNN_HTML, CNN_CONFIG);

    // First article has relative URL
    expect(articles[0].url).toMatch(/^https:\/\/edition\.cnn\.com/);
    // Second article has absolute URL
    expect(articles[1].url).toBe("https://edition.cnn.com/2026/03/13/world/iran-nuclear-deal");
  });

  it("should parse Reuters articles from HTML", () => {
    const articles = parseArticlesFromHtml(MOCK_REUTERS_HTML, REUTERS_CONFIG);

    expect(articles).toHaveLength(2);
    expect(articles[0].title).toBe("Iran tensions escalate in Middle East");
    expect(articles[0].source).toBe("reuters");
    expect(articles[0].summary).toBe("Military exercises near Hormuz strait");
  });

  it("should classify category and region from text", () => {
    const articles = parseArticlesFromHtml(MOCK_REUTERS_HTML, REUTERS_CONFIG);

    // "Iran tensions escalate in Middle East" + "Military exercises near Hormuz strait"
    expect(articles[0].region).toBe("middle-east");
  });

  it("should parse Economist articles from HTML", () => {
    const articles = parseArticlesFromHtml(MOCK_ECONOMIST_HTML, ECONOMIST_CONFIG);

    expect(articles).toHaveLength(1);
    expect(articles[0].title).toBe("China military buildup raises concerns");
    expect(articles[0].source).toBe("economist");
    expect(articles[0].summary).toBe("Asia-Pacific tensions increase as naval deployments expand");
  });

  it("should generate unique sourceId from URL", () => {
    const articles = parseArticlesFromHtml(MOCK_CNN_HTML, CNN_CONFIG);

    expect(articles[0].sourceId).toBeTruthy();
    expect(articles[0].sourceId).not.toBe(articles[1].sourceId);
    expect(articles[0].sourceId).toHaveLength(16);
  });

  it("should skip articles with empty title or link", () => {
    const emptyHtml = `
    <html><body>
      <div data-component-name="card">
        <a href=""><span class="container__headline-text"></span></a>
      </div>
    </body></html>`;

    const articles = parseArticlesFromHtml(emptyHtml, CNN_CONFIG);
    expect(articles).toHaveLength(0);
  });

  it("should handle HTML with no matching selectors", () => {
    const noMatchHtml = "<html><body><p>No articles here</p></body></html>";
    const articles = parseArticlesFromHtml(noMatchHtml, CNN_CONFIG);
    expect(articles).toHaveLength(0);
  });

  it("should handle null summary when selector not defined", () => {
    const configNoSummary: SiteConfig = {
      ...CNN_CONFIG,
      selectors: { ...CNN_CONFIG.selectors, summary: undefined },
    };
    const articles = parseArticlesFromHtml(MOCK_CNN_HTML, configNoSummary);

    expect(articles[0].summary).toBeNull();
  });
});
