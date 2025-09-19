
import { NextRequest, NextResponse } from 'next/server';
import { searchOpenWeb } from '../../../lib/search';
import { runMagicLLM } from '../../../lib/llm_magic';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { subject, questions } = await req.json();
    if (!subject || typeof subject !== 'string') {
      return NextResponse.json({ error: 'subject required' }, { status: 400 });
    }
    const qs: string[] = Array.isArray(questions) ? questions.filter(q => typeof q === 'string') : [];

    // Web search on open web with hint-based queries
    const pageSummaries = await searchOpenWeb(subject, qs);
    if (pageSummaries.length === 0) {
      return NextResponse.json({ error: 'No readable pages found via web search.' }, { status: 404 });
    }

    // LLM structured extraction
    const result = await runMagicLLM(subject, qs, pageSummaries);
    // Ensure subject filled
    if (!result.subject) result.subject = { name: subject, type: 'unknown' as const };
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'unknown error' }, { status: 500 });
  }
}
