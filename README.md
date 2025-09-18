# Ask Ava Enrichments — MVP (Bedrock + Tavily)

Minimal Next.js + TypeScript app that lets a user enter a **company domain** (or homepage URL),
runs a **web search** (Tavily API) with domain restriction, pulls cleaned page content,
and asks **Amazon Bedrock (Converse API)** to return **structured enrichment**: facts (with sources),
personalization snippets, coaching hints, and filterable attributes.

> Scope is intentionally narrow and fast to implement. No login, no DB.

## Quick Start

```bash
npm i
# Create .env.local file with your API keys:
#   MODEL_PROVIDER=bedrock
#   AWS_REGION=us-east-1
#   BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
#   AWS_ACCESS_KEY_ID=your_aws_access_key
#   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
#   TAVILY_API_KEY=your_tavily_api_key

npm run dev
# open http://localhost:3000
```

## What changed vs previous MVP
- **LLM:** uses **Amazon Bedrock** (Converse API) via `@aws-sdk/client-bedrock-runtime`.
- **Search:** uses **Tavily Search API** to discover relevant first‑party content with `include_domains=[domain]`
  and return **cleaned content** (`include_raw_content="markdown"`). Falls back to open‑web if no first‑party results.
- **Pipeline:** `search -> summarize pages -> Bedrock extraction (strict JSON)`.

## Environment

- `MODEL_PROVIDER=bedrock`
- `AWS_REGION=us-east-1` (or your region that has the model)
- `BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0` (or other)
- `TAVILY_API_KEY=tvly-...`

## Notes
- The Tavily request uses: `include_raw_content="markdown"`, `max_results=5`, `search_depth="advanced"`, and `include_domains=[domain]`.
- If results are empty, it retries without domain restriction using the domain + ask string.
- The Bedrock prompt enforces **strict JSON** conforming to `EnrichmentResponse` (see `lib/types.ts`).

## Roadmap
- Respect robots.txt and site TOS with a thinning fetcher (post-MVP).
- Add confidence scoring; bulk enrichment with a small DB.
- Add a single news aggregator hop (topic=news or time filters) when freshness is critical.
