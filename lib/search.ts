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
  includeDomains?: string[];
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
  if (opts.includeDomains && opts.includeDomains.length) body.include_domains = opts.includeDomains;

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

export async function searchDomainOrOpen(domain: string, ask: string) {
  // Validate Tavily API key
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY not configured.');
  }

  // 1) Domain-restricted
  const q1 = ask && ask.trim().length > 0 ? ask : "recent updates, hiring, blog posts, product launches";
  let results: TavilyResult[] = [];
  try {
    const r1 = await tavilySearch(q1, { includeDomains: [domain], maxResults: 5, depth: 'advanced', includeRaw: 'markdown' });
    results = r1.results ?? [];
  } catch {}
  // 2) Fallback: open web using domain as keyword
  if (!results || results.length === 0) {
    try {
      const q2 = `${domain} ${q1}`;
      const r2 = await tavilySearch(q2, { maxResults: 5, depth: 'advanced', includeRaw: 'markdown' });
      results = r2.results ?? [];
    } catch {}
  }
  // Normalize to page summaries
  const pages = (results || [])
    .filter(r => (r.raw_content || r.content))
    .map(r => ({ url: r.url, text: String(r.raw_content || r.content || '').slice(0, 6000) }));
  return pages;
}
