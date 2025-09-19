import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const SEARCH_QUERY_PROMPT = `You are a web search optimization expert that generates targeted search queries for research.

Given a subject and optional search queries, generate 3-5 specific web search queries that will find the most relevant information.

IMPORTANT: The current year is 2025. When searching for recent information, use 2025 and 2024 as the relevant time periods.

Rules:
- Generate queries that are likely to return relevant web pages
- Include the subject name in each query
- Make queries specific enough to find targeted information
- Use natural language that people would actually search for
- Include variations and synonyms
- Focus on finding recent, authoritative sources (2024-2025)
- Return ONLY a JSON array of strings, no other text

Examples:
Subject: "Jack Carmichael"
Search Queries: ["Has he been on a podcast this year?", "What is the name of the last podcast he went on?"]
Response: [
  "Jack Carmichael podcast 2025",
  "Jack Carmichael interview podcast 2024 2025",
  "Jack Carmichael last podcast appearance",
  "Jack Carmichael podcast guest 2024",
  "Jack Carmichael tech podcast interview",
  "Jack Carmichael business podcast"
]

Subject: "OpenAI"
Search Queries: ["What are their recent product launches?", "Who is their CEO?"]
Response: [
  "OpenAI recent product launches 2025",
  "OpenAI new features announcements 2024 2025",
  "OpenAI CEO Sam Altman",
  "OpenAI leadership team",
  "OpenAI latest news updates 2025",
  "OpenAI product roadmap 2025"
]`;

export async function generateSearchQueries(subject: string, searchQueries?: string[]): Promise<string[]> {
  // Validate required environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local');
  }
  if (!process.env.BEDROCK_MODEL_ID) {
    throw new Error('Missing BEDROCK_MODEL_ID in .env.local');
  }

  const userPrompt = `Subject: ${subject}
${searchQueries && searchQueries.length > 0 ? `Search Queries: ${JSON.stringify(searchQueries, null, 2)}` : 'No specific search queries provided - generate general research queries.'}

Generate 3-5 specific web search queries that will find the most relevant information about this subject.`;

  const cmd = new ConverseCommand({
    modelId: process.env.BEDROCK_MODEL_ID!,
    system: [{ text: SEARCH_QUERY_PROMPT }],
    messages: [{ role: 'user', content: [{ text: userPrompt }] }],
    inferenceConfig: {
      maxTokens: 800,
      temperature: 0.3, // Lower temperature for more consistent query generation
    }
  });

  const res = await client.send(cmd);
  const text = res.output?.message?.content?.[0]?.text;
  if (!text) throw new Error('No text from Bedrock.');

  try {
    // Try to extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const queries = JSON.parse(jsonMatch[0]);
      if (Array.isArray(queries) && queries.every(q => typeof q === 'string')) {
        return queries;
      }
    }
    
    // Fallback: try parsing the entire response
    const queries = JSON.parse(text);
    if (Array.isArray(queries) && queries.every(q => typeof q === 'string')) {
      return queries;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Search query generation failed:', error);
    console.error('Raw response:', text);
    
    // Fallback to simple query generation
    return generateFallbackQueries(subject, searchQueries);
  }
}

function generateFallbackQueries(subject: string, searchQueries?: string[]): string[] {
  const queries: string[] = [];
  
  // Always include basic subject search
  queries.push(subject);
  
  // Add queries based on search queries if provided
  if (searchQueries && searchQueries.length > 0) {
    const searchText = searchQueries.join(' ').toLowerCase();
    
    if (/podcast|interview|episode/.test(searchText)) {
      queries.push(`${subject} podcast interview`);
      queries.push(`${subject} podcast appearance 2025`);
    }
    if (/ceo|founder|leadership|executive/.test(searchText)) {
      queries.push(`${subject} CEO founder`);
      queries.push(`${subject} leadership team`);
    }
    if (/product|launch|announcement|feature/.test(searchText)) {
      queries.push(`${subject} product launch 2025`);
      queries.push(`${subject} new features`);
    }
    if (/funding|investment|raised|venture/.test(searchText)) {
      queries.push(`${subject} funding investment`);
      queries.push(`${subject} venture capital`);
    }
    if (/news|recent|latest|update/.test(searchText)) {
      queries.push(`${subject} news 2025`);
      queries.push(`${subject} recent updates`);
    }
  }
  
  // Add general research queries
  queries.push(`${subject} company information`);
  queries.push(`${subject} recent news`);
  
  // Remove duplicates and limit to 4 queries
  return [...new Set(queries)].slice(0, 4);
}
