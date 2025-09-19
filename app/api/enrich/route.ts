import { NextRequest, NextResponse } from 'next/server';
import { searchDomainOrOpen } from '../../../lib/search';
import { runLLM } from '../../../lib/llm';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { domainOrUrl, ask } = await req.json();
    if (!domainOrUrl || typeof domainOrUrl !== 'string') {
      return NextResponse.json({ error: 'domainOrUrl required' }, { status: 400 });
    }
    // derive domain
    const u = new URL(/^https?:\/\//i.test(domainOrUrl) ? domainOrUrl : `https://${domainOrUrl}`);
    const domain = u.hostname;

    // Search + content
    const pageSummaries = await searchDomainOrOpen(domain, ask || '');
    if (pageSummaries.length === 0) {
      return NextResponse.json({ error: 'No readable pages found via web search.' }, { status: 404 });
    }

    // LLM extraction
    const result = await runLLM(domain, ask || 'Find a timely personalization angle and any hiring signals.', pageSummaries);
    if (!result.subject_canonical) result.subject_canonical = { domain };
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'unknown error' }, { status: 500 });
  }
}
