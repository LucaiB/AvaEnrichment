import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

const QUESTION_GENERATION_PROMPT = `You are a research assistant that generates intelligent questions for company/person analysis.

Given a subject (company name, person name, or domain), generate 5-7 specific, researchable questions that would provide valuable insights for sales and business development.

Question categories to consider:
1. Company basics (founding year, size, location, industry)
2. Leadership and team (CEO, founders, key executives)
3. Business model and products (main offerings, revenue model)
4. Recent developments (news, funding, partnerships, hiring)
5. Market position (competitors, growth stage, funding status)
6. Culture and values (mission, values, company culture)
7. Challenges and opportunities (pain points, growth areas)

Rules:
- Generate questions that can be answered from web search
- Make questions specific and actionable
- Avoid questions that require private/internal information
- Focus on information useful for sales outreach
- Return ONLY a JSON array of strings, no other text

Example format:
["What year was the company founded?", "Who is the CEO or founder?", "What is their main product or service?"]`;

export async function generateQuestions(subject: string, context?: string): Promise<string[]> {
  // Validate required environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local');
  }
  if (!process.env.BEDROCK_MODEL_ID) {
    throw new Error('Missing BEDROCK_MODEL_ID in .env.local');
  }

  const userPrompt = `Subject: ${subject}
${context ? `Context: ${context}` : ''}

Generate 6-8 specific, researchable questions about this subject that would be valuable for sales and business development.`;

  const cmd = new ConverseCommand({
    modelId: process.env.BEDROCK_MODEL_ID!,
    system: [{ text: QUESTION_GENERATION_PROMPT }],
    messages: [{ role: 'user', content: [{ text: userPrompt }] }],
    inferenceConfig: {
      maxTokens: 1000,
      temperature: 0.3,
    }
  });

  const res = await client.send(cmd);
  const text = res.output?.message?.content?.[0]?.text;
  if (!text) throw new Error('No text from Bedrock.');

  try {
    // Try to extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(questions) && questions.every(q => typeof q === 'string')) {
        return questions;
      }
    }
    
    // Fallback: try parsing the entire response
    const questions = JSON.parse(text);
    if (Array.isArray(questions) && questions.every(q => typeof q === 'string')) {
      return questions;
    }
    
    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Question generation failed:', error);
    console.error('Raw response:', text);
    
    // Fallback to default questions
    return [
      'What year was the company founded?',
      'Who is the CEO or founder?',
      'What is their main product or service?',
      'How many employees do they have?',
      'What is their latest funding round?',
      'What are their recent achievements or news?',
      'What is their company culture like?',
      'What challenges are they facing?'
    ];
  }
}

