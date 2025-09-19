import { NextRequest, NextResponse } from 'next/server';
import { intelligentSearch } from '../../../lib/intelligent_search';
import { runLLM } from '../../../lib/llm';
import { runMagicLLM } from '../../../lib/llm_magic';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { subject, query } = await req.json();
    if (!subject || typeof subject !== 'string') {
      return NextResponse.json({ error: 'subject required' }, { status: 400 });
    }

    // Parse search queries from the query field
    const searchQueries = query ? query.split('\n').map(q => q.trim()).filter(Boolean) : undefined;
    
    // Determine if subject is a domain/URL or a name
    const isDomain = /^https?:\/\//i.test(subject) || /\.(com|org|net|io|co|ai|dev|app|tech|inc|llc|corp|company)$/i.test(subject);
    
    // Use intelligent search to get pages and questions
    const { pages: pageSummaries, questions, searchQueries: generatedQueries } = await intelligentSearch(subject, searchQueries);
    
    if (pageSummaries.length === 0) {
      return NextResponse.json({ error: 'No readable pages found via web search.' }, { status: 404 });
    }

    // Run both AI calls in parallel
    const aiPromises = [
      runMagicLLM(subject, questions, pageSummaries)
        .then(result => {
          if (!result.subject) {
            result.subject = { name: subject, type: isDomain ? 'company' : 'unknown' as const };
          }
          return { type: 'magic', result };
        })
        .catch(error => {
          console.log('Magic extraction failed for subject:', subject, error);
          return { type: 'magic', result: null };
        }),
      
      runLLM(subject, query || 'Find recent news, product launches, hiring signals, funding rounds, and partnership announcements for personalization angles.', pageSummaries)
        .then(result => {
          if (!result.subject_canonical) {
            if (isDomain) {
              const u = new URL(/^https?:\/\//i.test(subject) ? subject : `https://${subject}`);
              result.subject_canonical = { domain: u.hostname };
            } else {
              result.subject_canonical = { company_legal_name: subject };
            }
          }
          return { type: 'enrichment', result };
        })
        .catch(error => {
          console.log('Enrichment failed for subject:', subject, error);
          return { type: 'enrichment', result: null };
        })
    ];

    // Wait for all AI calls to complete
    const aiResults = await Promise.all(aiPromises);
    
    // Process results
    let enrichmentResult = null;
    let magicResult = null;
    
    for (const { type, result } of aiResults) {
      if (type === 'enrichment') {
        enrichmentResult = result;
      } else if (type === 'magic') {
        magicResult = result;
      }
    }

    return NextResponse.json({
      subject: subject,
      isDomain: isDomain,
      enrichment: enrichmentResult,
      magic: magicResult,
      sources: pageSummaries.length,
      searchQueries: generatedQueries
    });

  } catch (e: any) {
    console.error('Unified API error:', e);
    return NextResponse.json({ error: e.message || 'unknown error' }, { status: 500 });
  }
}
