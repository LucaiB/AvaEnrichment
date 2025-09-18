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
