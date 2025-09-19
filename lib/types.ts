export type Fact = {
  name: string;
  value: string;
  confidence?: number;
  source?: { url?: string; excerpt?: string };
  retrieved_at?: string;
};

export type Personalization = {
  variant: 'one_liner' | 'short' | 'custom';
  text: string;
};

export type Coaching = {
  hint: string;
  evidence_fact_indices?: number[];
};

export type EnrichmentResponse = {
  subject_canonical?: { company_legal_name?: string; domain?: string };
  facts: Fact[];
  personalization: Personalization[];
  coaching?: Coaching[];
  target_attributes?: Record<string, unknown>;
};


export type MagicVariableAnswer = {
  question: string;           // original question asked
  name?: string;              // normalized variable name (e.g., founded_year)
  value: string | number | boolean | null;
  unit?: string;
  confidence?: number;        // 0..1
  source?: { url?: string; excerpt?: string };
  evidence?: string;          // short rationale or quoted snippet
  normalized?: Record<string, unknown>; // optional normalized breakdown (e.g., { year: 2017 })
};

export type MagicVariablesResponse = {
  subject: { name: string; type?: 'company' | 'person' | 'unknown' };
  variables: MagicVariableAnswer[];
};
