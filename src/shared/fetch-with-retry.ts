/**
 * fetch wrapper with exponential backoff retry on 429 (rate limit).
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status !== 429) {
      return response;
    }

    lastResponse = response;

    if (attempt < maxRetries) {
      const delayMs = Math.min(1000 * 2 ** attempt, 30_000); // 1s, 2s, 4s (max 30s)
      console.warn(
        `[fetchWithRetry] 429 rate limited. Retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`,
      );
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  return lastResponse!;
}
