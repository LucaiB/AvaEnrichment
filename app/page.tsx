'use client';
import { useState } from 'react';
type EnrichmentResponse = import('../lib/types').EnrichmentResponse;

export default function Page() {
  const [domainOrUrl, setDomainOrUrl] = useState('');
  const [ask, setAsk] = useState('Find a timely personalization angle');
  const [loading, setLoading] = useState(false);
  const [resp, setResp] = useState<EnrichmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true); setError(null); setResp(null);
    try {
      const r = await fetch('/api/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainOrUrl, ask }),
      });
      if (!r.ok) {
        const t = await r.text(); throw new Error(t || r.statusText);
      }
      setResp(await r.json());
    } catch (e:any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <main>
      <div className="header">
        <h1>Ask Ava Enrichments</h1>
        <p>AI-powered company insights for sales and business development</p>
      </div>

      <div className="card">
        <div className="row">
          <div className="input-group">
            <label htmlFor="domain-input">Company Domain</label>
            <input
              id="domain-input"
              placeholder="company.com or https://company.com"
              value={domainOrUrl}
              onChange={(e) => setDomainOrUrl(e.target.value)}
            />
          </div>
          <button className="btn" onClick={run} disabled={loading || !domainOrUrl}>
            {loading ? 'Enriching…' : 'Enrich'}
          </button>
        </div>
        <div className="input-group">
          <label htmlFor="query-input">Search Query</label>
          <textarea
            id="query-input"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            rows={2}
            placeholder="Find a timely personalization angle"
          />
          <div className="muted">Hint: keep it short and concrete.</div>
        </div>
      </div>

      {error && <div className="card error"><b>Error:</b> {error}</div>}

      {resp && (
        <div className="card result-section">
          <h2>Enrichment Results</h2>
          <div className="subject-info">
            Subject: {resp.subject_canonical?.company_legal_name || resp.subject_canonical?.domain}
          </div>

          <h3>Key Facts</h3>
          <ul className="fact-list">
            {resp.facts?.map((f, i) => (
              <li key={i}>
                <div className="fact-name">{f.name}</div>
                <div className="fact-value">
                  {f.value} {f.confidence !== undefined && <span className="badge">conf {Math.round((f.confidence||0)*100)}%</span>}
                </div>
                {f.source?.url && <div className="fact-source"><a href={f.source.url} target="_blank" rel="noreferrer">View Source</a></div>}
              </li>
            ))}
          </ul>

          <h3>Personalization Angles</h3>
          <ul className="personalization-list">
            {resp.personalization?.map((p, i) => (
              <li key={i}>
                <span className="personalization-variant">{p.variant}</span>
                <div className="personalization-text">{p.text}</div>
              </li>
            ))}
          </ul>

          {!!resp.coaching?.length && <>
            <h3>Sales Coaching</h3>
            <ul className="coaching-list">
              {resp.coaching.map((c, i) => (<li key={i} className="coaching-hint">{c.hint}</li>))}
            </ul>
          </>}

          {!!resp.target_attributes && <>
            <h3>Target Attributes</h3>
            <div className="target-attributes">{JSON.stringify(resp.target_attributes, null, 2)}</div>
          </>}
        </div>
      )}
    </main>
  );
}
