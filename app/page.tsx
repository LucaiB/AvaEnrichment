'use client';
import { useState } from 'react';
type EnrichmentResponse = import('../lib/types').EnrichmentResponse;
type MagicVariablesResponse = import('../lib/types').MagicVariablesResponse;

type UnifiedResponse = {
  subject: string;
  isDomain: boolean;
  enrichment: EnrichmentResponse | null;
  magic: MagicVariablesResponse | null;
  sources: number;
  searchQueries?: string[];
};

export default function Page() {
  const [subject, setSubject] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UnifiedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await fetch('/api/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, query }),
      });
      if (!r.ok) {
        const t = await r.text(); throw new Error(t || r.statusText);
      }
      setResult(await r.json());
    } catch (e:any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <main>
      <div className="header">
        <h1>Ask Ava Enrichments</h1>
        <p>AI-powered insights for sales and business development</p>
      </div>

      <div className="card">
        <div className="row">
          <div className="input-group">
            <label htmlFor="subject-input">Subject</label>
            <input
              id="subject-input"
              placeholder="e.g., OpenAI, company.com, or John Smith"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <button className="btn" onClick={runAnalysis} disabled={loading || !subject}>
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
        <div className="input-group">
          <label htmlFor="query-input">Search Query (Optional)</label>
          <textarea
            id="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={2}
            placeholder="Find a timely personalization angle"
          />
          <div className="muted">Hint: keep it short and concrete. Leave empty for comprehensive analysis.</div>
        </div>
      </div>

      {error && <div className="card error"><b>Error:</b> {error}</div>}

      {result && (
        <div className="card result-section">
          <h2>Analysis Results</h2>
          <div className="subject-info">
            Subject: {result.subject} ({result.isDomain ? 'Domain' : 'Name'}) • {result.sources} sources found
          </div>


          {result.enrichment && (
            <>
              <h3>Sales Insights & Personalization</h3>
              {result.enrichment.facts && result.enrichment.facts.length > 0 && (
                <>
                  <h4>Key Facts</h4>
                  <ul className="fact-list">
                    {result.enrichment.facts.map((f, i) => (
                      <li key={i}>
                        <div className="fact-name">{f.name}</div>
                        <div className="fact-value">
                          {f.value} {f.confidence !== undefined && <span className="badge">conf {Math.round((f.confidence||0)*100)}%</span>}
                        </div>
                        {f.source?.url && <div className="fact-source"><a href={f.source.url} target="_blank" rel="noreferrer">View Source</a></div>}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {result.enrichment.personalization && result.enrichment.personalization.length > 0 && (
                <>
                  <h4>Personalization Angles</h4>
                  <ul className="personalization-list">
                    {result.enrichment.personalization.map((p, i) => (
                      <li key={i}>
                        <span className="personalization-variant">{p.variant}</span>
                        <div className="personalization-text">{p.text}</div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {result.enrichment.coaching && result.enrichment.coaching.length > 0 && (
                <>
                  <h4>Sales Coaching</h4>
                  <ul className="coaching-list">
                    {result.enrichment.coaching.map((c, i) => (<li key={i} className="coaching-hint">{c.hint}</li>))}
                  </ul>
                </>
              )}

              {result.enrichment.target_attributes && Object.keys(result.enrichment.target_attributes).length > 0 && (
                <>
                  <h4>Target Attributes</h4>
                  <div className="target-attributes">{JSON.stringify(result.enrichment.target_attributes, null, 2)}</div>
                </>
              )}
            </>
          )}

          {result.magic && result.magic.variables && result.magic.variables.length > 0 && (() => {
            const filteredVariables = result.magic.variables.filter((v: any) => {
              // Filter out null values and low confidence results
              if (v.value === null || v.value === undefined || v.value === '') {
                return false;
              }
              // Filter out results with very low confidence (less than 10%)
              if (typeof v.confidence !== 'undefined' && v.confidence < 0.1) {
                return false;
              }
              // Filter out malformed data (objects, arrays, or [object Object] strings)
              const valueStr = String(v.value);
              if (valueStr.includes('[object Object]') || 
                  valueStr.includes('[object Array]') ||
                  valueStr === '[object Object]' ||
                  valueStr === '[object Array]' ||
                  (typeof v.value === 'object' && v.value !== null)) {
                return false;
              }
              // Filter out incomplete or unclear data
              if (valueStr.length < 2 || valueStr.trim() === '') {
                return false;
              }
              return true;
            });

            return filteredVariables.length > 0 ? (
              <>
                <h3>Extracted Data Points</h3>
                <ul className="facts-list">
                  {filteredVariables.map((v: any, i: number) => (
                    <li key={i} className="fact-item">
                      <div><b>Q:</b> {v.question}</div>
                      <div><b>Name:</b> {v.name || '(n/a)'} </div>
                      <div><b>Value:</b> {String(v.value)}</div>
                      {typeof v.confidence !== 'undefined' && <div><b>Confidence:</b> {Math.round((v.confidence||0)*100)}%</div>}
                      {v.source?.url && <div><a href={v.source.url} target="_blank" rel="noreferrer">{v.source.url}</a></div>}
                      {v.source?.excerpt && <div className="muted">{v.source.excerpt}</div>}
                    </li>
                  ))}
                </ul>
                {result.magic.subject && <div className="muted">Subject: {result.magic.subject?.name} ({result.magic.subject?.type || 'unknown'})</div>}
              </>
            ) : (
              <div className="muted">No reliable data points could be extracted from the available information.</div>
            );
          })()}

          {(!result.enrichment && !result.magic) && (
            <div className="muted">No structured data could be extracted. Try a different subject or query.</div>
          )}
        </div>
      )}

    </main>
  );
}
