import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const HINT_GENERATION_PROMPT = `You are a search optimization assistant that generates relevant search keywords and hints based on research questions.

Given a subject and a list of questions, generate 3-4 specific search keywords/hints that would help find the most relevant information.

Rules:
- Generate keywords that are likely to appear in relevant web pages
- Include industry-specific terms, company types, and common phrases
- Focus on terms that would appear in official sources, news, and documentation
- Make keywords specific enough to find relevant content but broad enough to catch variations
- Return ONLY a JSON array of strings, no other text

Example:
Subject: "OpenAI"
Questions: ["What year was the company founded?", "Who is the CEO?", "What is their main product?"]
Response: ["founded year", "about us", "press release", "CEO", "leadership", "artificial intelligence", "GPT", "ChatGPT"]`;

export async function generateSearchHints(subject: string, questions: string[]): Promise<string[]> {
  // Validate required environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local');
  }
  if (!process.env.BEDROCK_MODEL_ID) {
    throw new Error('Missing BEDROCK_MODEL_ID in .env.local');
  }

  const userPrompt = `Subject: ${subject}
Questions: ${JSON.stringify(questions, null, 2)}

Generate 3-4 specific search keywords/hints that would help find relevant information for these questions.`;

  const cmd = new ConverseCommand({
    modelId: process.env.BEDROCK_MODEL_ID!,
    system: [{ text: HINT_GENERATION_PROMPT }],
    messages: [{ role: 'user', content: [{ text: userPrompt }] }],
    inferenceConfig: {
      maxTokens: 500,
      temperature: 0.2, // Lower temperature for more consistent keyword generation
    }
  });

  const res = await client.send(cmd);
  const text = res.output?.message?.content?.[0]?.text;
  if (!text) throw new Error('No text from Bedrock.');

  try {
    // Try to extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const hints = JSON.parse(jsonMatch[0]);
      if (Array.isArray(hints) && hints.every(h => typeof h === 'string')) {
        return hints;
      }
    }
    
    // Fallback: try parsing the entire response
    const hints = JSON.parse(text);
    if (Array.isArray(hints) && hints.every(h => typeof h === 'string')) {
      return hints;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Hint generation failed:', error);
    console.error('Raw response:', text);
    
    // Fallback to intelligent keyword extraction from questions
    return extractKeywordsFromQuestions(subject, questions);
  }
}

function extractKeywordsFromQuestions(subject: string, questions: string[]): string[] {
  const hints: string[] = [];
  const qtext = questions.join(" ").toLowerCase();
  
  // Extract keywords based on question patterns
  if (/found(ed|ing)|incorporat|launched|started|established/.test(qtext)) {
    hints.push("founded year", "about us", "press release", "company history");
  }
  if (/(ceo|founder|leadership|executive|president)/.test(qtext)) {
    hints.push("CEO", "founder", "leadership", "executive team", "management");
  }
  if (/(product|service|offering|platform|software)/.test(qtext)) {
    hints.push("product", "service", "platform", "technology", "solution");
  }
  if (/(employee|staff|team|hiring|jobs)/.test(qtext)) {
    hints.push("employees", "team size", "hiring", "careers", "jobs");
  }
  if (/(funding|investment|venture|capital|raised)/.test(qtext)) {
    hints.push("funding", "investment", "venture capital", "funding round", "raised");
  }
  if (/(news|announcement|update|recent|latest)/.test(qtext)) {
    hints.push("news", "announcement", "press release", "recent updates", "latest");
  }
  if (/(culture|values|mission|vision)/.test(qtext)) {
    hints.push("company culture", "values", "mission", "vision", "culture");
  }
  if (/(challenge|problem|issue|pain)/.test(qtext)) {
    hints.push("challenges", "problems", "pain points", "issues", "difficulties");
  }
  if (/(yc|y combinator|accelerator|incubator)/.test(qtext)) {
    hints.push("Y Combinator", "YC batch", "accelerator", "startup");
  }
  if (/(podcast|interview|episode|media)/.test(qtext)) {
    hints.push("podcast", "interview", "episode", "media", "spotify", "youtube");
  }
  
  // Add subject-specific hints
  if (subject.toLowerCase().includes('ai') || subject.toLowerCase().includes('artificial intelligence')) {
    hints.push("artificial intelligence", "AI", "machine learning", "ML");
  }
  if (subject.toLowerCase().includes('fintech') || subject.toLowerCase().includes('payment')) {
    hints.push("fintech", "payments", "financial technology", "banking");
  }
  if (subject.toLowerCase().includes('saas') || subject.toLowerCase().includes('software')) {
    hints.push("SaaS", "software", "cloud", "platform");
  }
  
  // Remove duplicates and limit to 6 hints
  return [...new Set(hints)].slice(0, 6);
}

