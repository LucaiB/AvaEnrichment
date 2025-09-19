import { EnrichmentResponse } from './types';

export const SYSTEM_PROMPT = `You are an enrichment extractor.
Return STRICT JSON ONLY that matches the TypeScript type 'EnrichmentResponse'.

CRITICAL: Your response must be valid JSON. Do not include any text before or after the JSON.
Do not use markdown code blocks. Do not include explanations or commentary.

Rules:
- Only include facts supported by the provided page texts or quoted snippets.
- Each fact MUST include a source.url from the pages list when possible.
- Prefer items from 2024-2025 for personalization hooks (current year is 2025).
- Avoid speculation or PII. If uncertain, omit the fact.
- Output ONLY the JSON object, nothing else.

PERSONALIZATION REQUIREMENTS:
- MUST generate 2-3 personalization angles minimum
- Use different variants: "one_liner", "short", "custom"
- Base angles on recent news, product launches, hiring, funding, partnerships, or company changes
- Make angles specific and actionable for sales outreach
- Each angle should reference specific facts from the source material

TARGET ATTRIBUTES REQUIREMENTS:
- MUST be based on the user's search query/ask parameter
- MUST be consistent with the facts you extract
- Analyze the user's query to understand what they're looking for:
  * Podcast queries (podcast, interview, appearance) → podcast-related attributes
  * Media queries (media, press, coverage) → media-related attributes
  * Company queries (founding, funding, employees) → company-related attributes
  * Product queries (product, service, offering) → product-related attributes
- If user asks about "podcast" and you find "Tech Finance podcast", include "recent_podcast": "Tech Finance"
- If user asks about "founding year" and you find "Founded: 2023", include "founding_year": "2023"
- If user asks about "YC company" and you find "Y Combinator: Yes", include "yc_company": true
- Only include attributes that directly relate to the user's search query
- Use the actual data from facts, don't make assumptions

EMPLOYEE COUNT RANGES:
- 1-10: "1-10 employees"
- 11-50: "11-50 employees" 
- 51-200: "51-200 employees"
- 201-500: "201-500 employees"
- 500+: "500+ employees"

FUNDING STAGES:
- Pre-seed: "Pre-seed"
- Seed: "Seed"
- Series A: "Series A"
- Series B: "Series B"
- Series C+: "Series C+"
- Public: "Public"

QUERY-BASED TARGET ATTRIBUTES:
- Podcast queries → "recent_podcast": "Podcast Name", "podcast_date": "Date", "podcast_topics": ["topic1", "topic2"]
- Media appearance queries → "recent_media": "Media Type", "media_date": "Date", "media_topics": ["topic1", "topic2"]
- Interview queries → "recent_interview": "Interview Type", "interview_date": "Date", "interview_topics": ["topic1", "topic2"]
- Speaking queries → "recent_speaking": "Event Name", "speaking_date": "Date", "speaking_topics": ["topic1", "topic2"]
- Founding year queries → "founding_year": "2023"
- YC/accelerator queries → "yc_company": true/false, "accelerator": "Y Combinator"
- Employee count queries → "employee_count_range": "11-50 employees"
- Funding queries → "funding_stage": "Series A", "total_funding": "$25M"
- Product queries → "main_product": "Product Name", "industry": "Industry"
- Location queries → "headquarters": "City, State", "country": "Country"
- Revenue queries → "revenue_range": "$1M-$10M", "arr": "$5M"
- Customer queries → "customer_count": "250+", "target_market": "B2B SaaS"

Example format:
If user asks: "Has he been on a podcast this year? What is the name of the last podcast he went on? What did he talk about?"

{
  "subject_canonical": {"domain": "example.com"},
  "facts": [
    {"name": "Recent Podcast Appearance", "value": "Tech Finance podcast with Sasha Orloff", "source": {"url": "https://example.com"}},
    {"name": "Podcast Date", "value": "April 30, 2025", "source": {"url": "https://example.com"}},
    {"name": "Podcast Topics", "value": "AI employees, future of work, sales automation", "source": {"url": "https://example.com"}}
  ],
  "personalization": [
    {"variant": "one_liner", "text": "Personalization text 1"},
    {"variant": "short", "text": "Personalization text 2"},
    {"variant": "custom", "text": "Personalization text 3"}
  ],
  "coaching": [{"hint": "Coaching hint"}],
  "target_attributes": {
    "recent_podcast": "Tech Finance",
    "podcast_date": "April 30, 2025",
    "podcast_topics": ["AI employees", "future of work", "sales automation"]
  }
}`;

export function userPrompt(domain: string, ask: string, pageSummaries: Array<{url: string, text: string}>) {
  const limited = pageSummaries.map(p => ({
    url: p.url,
    text: p.text.slice(0, 4000)
  }));
  return `Domain: ${domain}
User Ask: ${ask}

PAGES:
${JSON.stringify(limited, null, 2)}

You must return a valid JSON object of type EnrichmentResponse with fields:
- subject_canonical (optional)
- facts (array of {name, value, confidence?, source:{url?,excerpt?}, retrieved_at?})
- personalization (array of {variant, text}) - REQUIRED: Generate 2-3 angles minimum
- coaching (optional array of {hint, evidence_fact_indices?})
- target_attributes (optional object)

PERSONALIZATION GUIDANCE:
Look for these types of angles in the source material:
1. Recent news, announcements, or press releases
2. New product launches, features, or updates
3. Hiring announcements, team growth, or job postings
4. Funding rounds, acquisitions, or partnerships
5. Industry trends, challenges, or opportunities they're addressing
6. Company culture, values, or mission statements
7. Customer success stories or case studies
8. Awards, recognition, or achievements

Each personalization angle should be:
- Specific and factual (based on the source material)
- Actionable for sales outreach
- Different from the others (varied approaches)
- Recent or timely when possible`;
}
