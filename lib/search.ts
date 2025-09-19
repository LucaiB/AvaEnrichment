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
  const q1 = ask && ask.trim().length > 0 ? ask : "recent news, product launches, hiring announcements, funding rounds, partnerships, awards, press releases, blog posts, company updates";
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


export async function searchOpenWeb(subject: string, questions: string[] = []): Promise<Array<{url: string, text: string}>> {
  // Generate dynamic search hints using AI
  let hints: string[] = [];
  try {
    const { generateSearchHints } = await import('./hint_generator');
    hints = await generateSearchHints(subject, questions || []);
  } catch (error) {
    console.log('Dynamic hint generation failed, using fallback:', error);
    // Fallback to simple keyword extraction
    const qtext = (questions || []).join(" ").toLowerCase();
    if (/found(ed|ing)|incorporat|launched|started/.test(qtext)) {
      hints.push("founded year", "about us", "press release");
    }
    if (/(yc|y combinator)/.test(qtext)) {
      hints.push("Y Combinator", "YC batch");
    }
    if (/podcast|interview|episode/.test(qtext)) {
      hints.push("podcast", "interview", "episode", "spotify", "apple podcasts", "youtube");
    }
  }

  const dedupe = new Set<string>();
  const pages: Array<{url: string, text: string}> = [];

  async function runQuery(q: string) {
    try {
      const r = await tavilySearch(q, { maxResults: 7, depth: 'advanced', includeRaw: 'markdown' });
      for (const it of (r.results || [])) {
        const url = it.url;
        const text = String(it.raw_content || it.content || '');
        if (!url || !text) continue;
        if (dedupe.has(url)) continue;
        dedupe.add(url);
        pages.push({ url, text: text.slice(0, 6000) });
      }
    } catch {}
  }

  // Primary queries
  await runQuery(`${subject}`);
  if (hints.length) {
    await runQuery(`${subject} ${hints.slice(0,3).join(' ')}`);
  }
  // Focused combos per hint
  for (const h of hints.slice(0, 4)) {
    await runQuery(`${subject} ${h}`);
  }

  // If nothing found, do a basic fallback with quotes
  if (pages.length === 0) {
    await runQuery(`"${subject}"`);
  }

  return pages;
}
