import { extractJson } from './json';
import { SYSTEM_PROMPT, userPrompt } from './prompt';
import type { EnrichmentResponse } from './types';
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function runLLM(domain: string, ask: string, pageSummaries: Array<{url: string, text: string}>): Promise<EnrichmentResponse> {
  // Validate required environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.');
  }
  if (!process.env.BEDROCK_MODEL_ID) {
    throw new Error('BEDROCK_MODEL_ID not configured.');
  }
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY not configured.');
  }

  const uPrompt = userPrompt(domain, ask, pageSummaries);
  const modelId = process.env.BEDROCK_MODEL_ID;

  const cmd = new ConverseCommand({
    modelId,
    system: [{ text: SYSTEM_PROMPT }],
    messages: [ { role: 'user', content: [{ text: uPrompt }] } ],
    inferenceConfig: { temperature: 0.2, maxTokens: 1400 }
  });

  const res = await client.send(cmd);
  const text = res.output?.message?.content?.[0]?.text;
  if (!text) throw new Error('No text from Bedrock.');
  
  console.log('Raw LLM response:', text);
  
  try {
    const parsed = extractJson(text) as EnrichmentResponse;
    return parsed;
  } catch (error) {
    console.error('JSON extraction failed:', error);
    console.error('Raw response:', text);
    throw new Error(`Failed to parse AI response as JSON. Please try again with a different query. Raw response: ${text.substring(0, 200)}...`);
  }
}
