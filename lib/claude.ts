import OpenAI from "openai";
import { SYSTEM_PROMPT, buildUserPrompt, UserFormData } from "./prompts";

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || "https://api.deepseek.com/v1",
});

export interface EvaluationResult {
  pathways: Pathway[];
  financial_analysis: FinancialAnalysis;
  timeline: Timeline;
  life_planning: LifePlanning;
  overall_verdict: "feasible" | "partially_feasible" | "not_feasible";
  verdict_reason: string;
  top_recommendation: string;
  summary_zh: string;
  summary_en: string;
}

export interface Pathway {
  name: string;
  name_en: string;
  country: string;
  country_code: string;
  visa_type: string;
  feasibility_score: number;
  feasibility_level: "high" | "medium" | "low";
  requirements_met: string[];
  gaps: string[];
  estimated_cost_usd: number;
  timeline_months: number;
  steps: { phase: string; duration_months: number; actions: string[] }[];
  pr_possible: boolean;
  pr_after_years?: number;
  citizenship_possible: boolean;
  citizenship_after_years?: number;
  summary_zh: string;
  summary_en: string;
}

export interface FinancialAnalysis {
  currency: string;
  exchange_rate_note: string;
  user_funds_local: number;
  frugal: LifestyleTier;
  comfortable: LifestyleTier;
  wealthy: LifestyleTier;
  one_time_costs: {
    visa_fees_usd: number;
    legal_fees_usd: number;
    relocation_usd: number;
    total_usd: number;
  };
}

export interface LifestyleTier {
  monthly_cost: number;
  monthly_cost_usd: number;
  months_sustainable: number;
  lifestyle_description: string;
}

export interface Timeline {
  preparation_months: number;
  application_months: number;
  approval_months: number;
  total_months: number;
  milestones: { month: number; event: string }[];
}

export interface LifePlanning {
  housing: string;
  healthcare: string;
  tax_implications: string;
  integration_tips: string;
  chinese_community: string;
  children_education: string;
}

export async function evaluateImmigration(
  formData: UserFormData,
  onChunk?: (text: string) => void
): Promise<void> {
  const userPrompt = buildUserPrompt(formData);
  const model = process.env.LLM_MODEL || "deepseek-chat";

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 8000,
    stream: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      onChunk?.(delta);
    }
  }
}
