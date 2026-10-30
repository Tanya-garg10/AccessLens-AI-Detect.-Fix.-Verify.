import { env } from "../env.js";

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilyResponse {
  answer?: string;
  query: string;
  response_time: number;
  images: unknown[];
  results: TavilySearchResult[];
}

/**
 * Search Tavily for accessibility best practices and WCAG guidelines
 * Used to enhance remediation explanations with authoritative sources
 */
export async function searchAccessibilityBestPractices(ruleId: string, wcagCriteria: string[]): Promise<string[]> {
  if (!env.TAVILY_API_KEY) {
    return [];
  }

  try {
    const query = `WCAG ${wcagCriteria.join(" ")} ${ruleId} accessibility best practices`;
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: 3,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      console.error("Tavily API error:", response.status, response.statusText);
      return [];
    }

    const data = (await response.json()) as TavilyResponse;
    return data.results.map((result) => `${result.title}: ${result.content.slice(0, 200)}...`);
  } catch (error) {
    console.error("Tavily search failed:", error);
    return [];
  }
}

/**
 * Get WCAG guideline explanations from authoritative sources
 */
export async function getWCAGGuidelineExplanation(criteria: string[]): Promise<string> {
  if (!env.TAVILY_API_KEY) {
    return "";
  }

  try {
    const query = `WCAG ${criteria.join(" and ")} guideline explanation`;
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: 1,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      return "";
    }

    const data = (await response.json()) as TavilyResponse;
    return data.answer || data.results[0]?.content || "";
  } catch (error) {
    console.error("Tavily WCAG search failed:", error);
    return "";
  }
}
