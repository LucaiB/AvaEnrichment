import { generateSearchQueries } from './search_query_generator';
import { generateQuestions } from './question_generator';

type TavilyResult = {
  title: string;
  url: string;
  content?: string | null;
  raw_content?: string | null;
  score?: number;
};

type TavilyResponse = {
  results: TavilyResult[];
};

const TAVILY_URL = "https://api.tavily.com/search";

async function tavilySearch(query: string, opts: {
  maxResults?: number;
  timeRange?: 'day'|'week'|'month'|'year';
  topic?: 'general'|'news'|'finance';
  depth?: 'basic'|'advanced';
  includeRaw?: 'markdown'|'text'|boolean;
}) {
  const body: any = {
    query,
    search_depth: opts.depth || 'advanced',
    topic: opts.topic || 'general',
    max_results: Math.min(Math.max(opts.maxResults ?? 5, 1), 20),
    include_answer: false,  // LLM will do the synthesis
    include_raw_content: opts.includeRaw ?? "markdown",
  };
  if (opts.timeRange) body.time_range = opts.timeRange;

  const r = await fetch(TAVILY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`Tavily error: ${await r.text()}`);
  return await r.json() as TavilyResponse;
}

export async function intelligentSearch(subject: string, searchQueries?: string[]): Promise<{
  pages: Array<{url: string, text: string}>;
  questions: string[];
  searchQueries: string[];
}> {
  // Validate Tavily API key
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY not configured.');
  }

  // Generate intelligent search queries based on subject and search queries
  const generatedSearchQueries = await generateSearchQueries(subject, searchQueries);
  
  // Generate questions for data extraction
  const questions = await generateQuestions(subject, `Subject: ${subject}`);

  const dedupe = new Set<string>();
  const pages: Array<{url: string, text: string}> = [];

  // Execute all search queries
  for (const query of generatedSearchQueries) {
    try {
      const r = await tavilySearch(query, { 
        maxResults: 2, 
        depth: 'advanced', 
        includeRaw: 'markdown' 
      });
      
      for (const it of (r.results || [])) {
        const url = it.url;
        const text = String(it.raw_content || it.content || '');
        if (!url || !text) continue;
        if (dedupe.has(url)) continue;
        dedupe.add(url);
        pages.push({ url, text: text.slice(0, 6000) });
      }
    } catch (error) {
      console.log(`Search query failed: ${query}`, error);
    }
  }

  return {
    pages,
    questions,
    searchQueries: generatedSearchQueries
  };
}
