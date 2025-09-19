# Ask Ava Enrichments

AI-powered company enrichment tool that provides structured insights for sales and business development. Enter a company domain and get facts, personalization angles, coaching hints, and target attributes.

## How It Works

1. **Enter a company domain** (e.g., `openai.com` or `https://stripe.com`)
2. **Customize your search query** (default: "Find a timely personalization angle")
3. **AI analyzes the company** using web search and Amazon Bedrock
4. **Get structured results** with facts, personalization, coaching, and attributes

### System Architecture

- **Web Search**: Uses Tavily API to find relevant content from the company's website
- **AI Processing**: Amazon Bedrock (Claude 3.5 Sonnet) extracts structured insights
- **Domain-First Strategy**: Prioritizes first-party content, falls back to open web
- **Structured Output**: Returns facts with sources, personalization variants, coaching hints, and target attributes

## Quick Start

```bash
# Install dependencies
npm install

# Create environment file
touch .env.local
# Edit .env.local with your API keys:
#   AWS_ACCESS_KEY_ID=your_aws_access_key
#   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
#   AWS_REGION=us-east-1
#   BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
#   TAVILY_API_KEY=your_tavily_api_key

# Start development server
npm run dev
# Open http://localhost:3000
```

## Environment Variables

Required environment variables in `.env.local`:

- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key  
- `AWS_REGION` - AWS region (e.g., `us-east-1`)
- `BEDROCK_MODEL_ID` - Bedrock model ID (e.g., `anthropic.claude-3-5-sonnet-20240620-v1:0`)
- `TAVILY_API_KEY` - Your Tavily API key

## Features

- **Modern UI**: Clean, responsive design with glass morphism effects
- **Smart Search**: Domain-restricted search with intelligent fallback
- **Robust Parsing**: Multiple JSON extraction strategies for reliable results
- **Source Attribution**: Every fact includes source URLs and excerpts
- **Confidence Scoring**: Optional confidence levels for extracted facts
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **AI**: Amazon Bedrock (Claude 3.5 Sonnet)
- **Search**: Tavily Search API
- **Styling**: Custom CSS with modern design patterns
