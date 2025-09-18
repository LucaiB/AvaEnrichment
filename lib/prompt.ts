import { EnrichmentResponse } from './types';

export const SYSTEM_PROMPT = `You are an enrichment extractor.
Return STRICT JSON ONLY that matches the TypeScript type 'EnrichmentResponse'.

CRITICAL: Your response must be valid JSON. Do not include any text before or after the JSON.
Do not use markdown code blocks. Do not include explanations or commentary.

Rules:
- Only include facts supported by the provided page texts or quoted snippets.
- Each fact MUST include a source.url from the pages list when possible.
- Prefer items from the last 90 days for personalization hooks.
- Avoid speculation or PII. If uncertain, omit the fact.
- Output ONLY the JSON object, nothing else.

Example format:
{
  "subject_canonical": {"domain": "example.com"},
  "facts": [{"name": "Fact Name", "value": "Fact Value", "source": {"url": "https://example.com"}}],
  "personalization": [{"variant": "one_liner", "text": "Personalization text"}],
  "coaching": [{"hint": "Coaching hint"}],
  "target_attributes": {}
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
- personalization (array of {variant, text})
- coaching (optional array of {hint, evidence_fact_indices?})
- target_attributes (optional object)`;
}
