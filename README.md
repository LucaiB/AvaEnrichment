# Ask Ava Enrichments

AI-powered enrichment tool that provides structured insights for sales and business development. Enter any subject (company, person, or domain) and get comprehensive facts, personalization angles, coaching hints, and magic variables for targeted outreach.

## How It Works

1. **Enter a subject** (e.g., `OpenAI`, `artisan.co`, or `Jaspar Carmichael-Jack`)
2. **Add optional search queries** (e.g., "Has he been on a podcast this year?")
3. **AI analyzes the subject** using dynamic web search and Amazon Bedrock
4. **Get structured results** with facts, personalization, coaching, and extracted data points

### System Architecture

- **Dynamic Web Search**: Uses Tavily API with AI-generated search queries (3-5 queries × 2 results)
- **Dual AI Processing**: Amazon Bedrock (Claude Sonnet + Haiku) for enrichment and magic variables
- **Parallel Processing**: Runs enrichment and data extraction simultaneously (20-30s response time)
- **Intelligent Question Generation**: LLM creates 6-8 relevant questions based on subject type
- **Query-Based Targeting**: Target attributes match user's specific search queries
- **Smart Filtering**: Only displays high-confidence, complete data points
- **Source Attribution**: Every fact includes source URLs and excerpts

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

### Core Functionality
- **Unified Interface**: Single "Analyze" button for both enrichment and magic variables
- **Subject Flexibility**: Works with companies, people, domains, or any subject
- **Dynamic Questions**: AI generates relevant questions instead of hardcoded ones
- **Magic Variables**: Extract specific data points with confidence scores
- **Personalization Angles**: 2-3 targeted personalization hooks per analysis
- **Sales Coaching**: Actionable hints for outreach and engagement

### Performance & Quality
- **Parallel Processing**: 2-3x faster with simultaneous AI calls
- **Optimized Search**: Reduced scope (3-5 queries × 2 results) for speed
- **Smart Filtering**: Only shows high-quality, complete data
- **Query-Based Targeting**: Target attributes match your specific search queries
- **Source Attribution**: Every fact includes source URLs and excerpts

### Technical Features
- **Modern UI**: Clean, responsive design with glass morphism effects
- **TypeScript**: Full type safety throughout the application
- **Robust Parsing**: Multiple JSON extraction strategies for reliable results
- **Error Handling**: Graceful fallbacks and individual error handling

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **AI**: Amazon Bedrock (Claude 3.5 Sonnet)
- **Search**: Tavily Search API
- **Styling**: Custom CSS with modern design patterns
