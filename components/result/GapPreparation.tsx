"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  PathwayContext,
  PreparationPlan,
  PrepCategory,
  UserContext,
} from "@/lib/prepare";
import { streamSSE } from "@/lib/sse-client";
import {
  RefreshCw,
  Sparkles,
  Target,
  Clock,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  Loader2,
} from "lucide-react";

interface Props {
  gap: string;
  pathway: PathwayContext;
  userContext: UserContext;
  onCollapse?: () => void;
}

const CATEGORY_ACCENT: Record<PrepCategory, { bg: string; text: string; border: string }> = {
  language:    { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  finance:     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  documents:   { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  credentials: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  job:         { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  skill:       { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  health:      { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  other:       { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
};

export function GapPreparation({ gap, pathway, userContext }: Props) {
  const t = useTranslations("result.prepare");
  const [plan, setPlan] = useState<PreparationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPlan = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setPlan(null);
    setError(null);
    setProgress(0);

    streamSSE<PreparationPlan>(
      "/api/prepare",
      { gap, pathway, user_context: userContext },
      {
        signal: ctrl.signal,
        onProgress: (acc) => setProgress(acc.length),
      }
    )
      .then((p) => {
        setPlan(p);
        setLoading(false);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [gap, pathway, userContext]);

  useEffect(() => {
    fetchPlan();
    return () => abortRef.current?.abort();
  }, [fetchPlan]);

  if (loading) {
    return (
      <div className="mt-2 ml-6 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/40 p-5">
        <div className="flex items-center gap-2 text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">{t("loading")}</span>
          {progress > 0 && (
            <span className="text-xs text-blue-500">({progress} chars)</span>
          )}
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-3 bg-blue-100 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-blue-100 rounded animate-pulse w-1/2" />
          <div className="h-3 bg-blue-100 rounded animate-pulse w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="mt-2 ml-6 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="text-sm text-red-700 mb-2">
          {t("error")}：{error}
        </div>
        <button
          onClick={fetchPlan}
          className="text-xs font-medium text-red-700 hover:text-red-900 underline"
        >
          {t("regenerate")}
        </button>
      </div>
    );
  }

  const accent = CATEGORY_ACCENT[plan.category] || CATEGORY_ACCENT.other;

  return (
    <div className={`mt-2 ml-6 rounded-xl border-2 ${accent.border} ${accent.bg} overflow-hidden`}>
      {/* Header */}
      <div className="p-5 border-b border-white/60 bg-white/40">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className={`h-4 w-4 ${accent.text}`} />
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${accent.text} bg-white`}>
                {plan.category_zh}
              </span>
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {t("duration_months", { n: plan.estimated_duration_months })}
              </span>
              <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <Wallet className="h-3 w-3" />
                {t("budget_label")} ≈ ${plan.estimated_budget_usd?.toLocaleString()}
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-800 leading-relaxed">{plan.overview}</p>
          </div>
          <button
            onClick={fetchPlan}
            className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white"
            title={t("regenerate")}
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">{t("regenerate")}</span>
          </button>
        </div>
      </div>

      {/* Phases */}
      <div className="p-5 space-y-4">
        {plan.phases.map((phase, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${accent.text} bg-white border-2 flex items-center justify-center text-xs font-bold ${accent.border}`}>
                    {i + 1}
                  </div>
                  <span className="font-semibold text-gray-900">{phase.title}</span>
                  <span className="text-xs text-gray-500">
                    {phase.duration_weeks} {t("weeks")}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 text-xs text-gray-600 flex items-start gap-1">
                <Target className="h-3 w-3 mt-0.5 flex-shrink-0" />
                {phase.goal}
              </div>
            </div>

            <div className="px-4 py-3 space-y-3">
              {/* Tasks */}
              {phase.tasks?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t("tasks")}
                  </div>
                  <ul className="space-y-1.5">
                    {phase.tasks.map((task, j) => (
                      <li key={j} className="text-sm text-gray-700 flex items-start gap-2">
                        <span className="text-gray-400 mt-0.5">•</span>
                        <div className="flex-1">
                          <span className="font-medium">{task.title}</span>
                          {task.time_per_week_hours != null && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({t("hours_per_week", { n: task.time_per_week_hours })})
                            </span>
                          )}
                          <div className="text-xs text-gray-500 mt-0.5">{task.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Resources */}
              {phase.resources?.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {t("resources")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {phase.resources.map((res, k) => {
                      const costLabel =
                        res.cost === "free"
                          ? t("resource_free")
                          : res.cost === "paid"
                          ? t("resource_paid")
                          : t("resource_freemium");
                      const content = (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 text-xs hover:border-gray-300 transition-colors">
                          <span className="font-medium text-gray-800">{res.name}</span>
                          <span
                            className={`px-1 rounded ${
                              res.cost === "free"
                                ? "bg-green-100 text-green-700"
                                : res.cost === "paid"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {costLabel}
                          </span>
                          {res.url && <ExternalLink className="h-3 w-3 text-gray-400" />}
                        </span>
                      );
                      return res.url ? (
                        <a
                          key={k}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={res.notes}
                        >
                          {content}
                        </a>
                      ) : (
                        <span key={k} title={res.notes}>
                          {content}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Milestones */}
        {plan.milestones?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              {t("milestones")}
            </div>
            <ul className="space-y-1.5">
              {plan.milestones.map((m, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${accent.text} bg-white border ${accent.border} flex-shrink-0`}>
                    {t("milestone_week", { n: m.week })}
                  </span>
                  <span className="flex-1">{m.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success criteria & risks */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              {t("success_criteria")}
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{plan.success_criteria}</p>
          </div>

          {plan.risks_tips?.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-600" />
                {t("risks_tips")}
              </div>
              <ul className="space-y-1">
                {plan.risks_tips.map((tip, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span className="flex-1">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
