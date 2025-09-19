
import { MAGIC_SYSTEM_PROMPT, magicUserPrompt } from './magic_prompt';
import { extractJson } from './json';
import type { MagicVariablesResponse } from './types';
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ 
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function runMagicLLM(subject: string, questions: string[], pageSummaries: Array<{url: string, text: string}>): Promise<MagicVariablesResponse> {
  // Validate required environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('Missing AWS credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local');
  }
  if (!process.env.BEDROCK_MODEL_ID) {
    throw new Error('Missing BEDROCK_MODEL_ID in .env.local');
  }

  const cmd = new ConverseCommand({
    modelId: process.env.BEDROCK_MODEL_ID!,
    system: [{ text: MAGIC_SYSTEM_PROMPT }],
    messages: [{ role: 'user', content: [{ text: magicUserPrompt(subject, questions, pageSummaries) }] }],
    inferenceConfig: {
      maxTokens: 4000,
      temperature: 0.1,
    }
  });

  const res = await client.send(cmd);
  const text = res.output?.message?.content?.[0]?.text;
  if (!text) throw new Error('No text from Bedrock.');

  try {
    const parsed = extractJson(text) as MagicVariablesResponse;
    return parsed;
  } catch (error) {
    console.error('Magic JSON extraction failed:', error);
    console.error('Raw response:', text);
    throw new Error(`Failed to parse AI response as JSON for magic variables.`);
  }
}
