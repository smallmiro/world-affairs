export interface SiteConfig {
  name: string;
  url: string;
  selectors: {
    articleList: string;
    title: string;
    link: string;
    summary?: string;
    imageUrl?: string;
  };
  waitFor?: string;
  originalLanguage?: string;
}

export const SCRAPER_CONFIGS: SiteConfig[] = [
  {
    name: "economist",
    url: "https://www.economist.com/international",
    selectors: {
      articleList: "[data-test-id='Article']",
      title: "h3",
      link: "a[href]",
      summary: "p.article__description",
    },
  },
  {
    name: "cnn",
    url: "https://edition.cnn.com/world",
    selectors: {
      articleList: "[data-component-name='card']",
      title: ".container__headline-text",
      link: "a[href]",
      summary: ".container__description",
    },
  },
  {
    name: "reuters",
    url: "https://www.reuters.com/world/",
    selectors: {
      articleList: "[data-testid='MediaStoryCard']",
      title: "[data-testid='Heading']",
      link: "a[href]",
      summary: "p",
    },
  },
  {
    name: "yahoo-news",
    url: "https://news.yahoo.com/world/",
    selectors: {
      articleList: "li.stream-item, [data-test-locator='stream-item']",
      title: "h3, .js-content-viewer",
      link: "a[href]",
      summary: "p",
    },
  },
  {
    name: "nbc-news",
    url: "https://www.nbcnews.com/world",
    selectors: {
      articleList: ".wide-tease-item__wrapper, article",
      title: "h2, .wide-tease-item__headline",
      link: "a[href]",
      summary: ".wide-tease-item__description",
    },
  },
];
