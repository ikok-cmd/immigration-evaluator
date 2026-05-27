"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Pathway } from "@/lib/claude";
import { UserFormData } from "@/lib/prompts";
import { UserContext, PathwayContext } from "@/lib/prepare";
import { GapPreparation } from "./GapPreparation";
import { LifestylePreviewView } from "./LifestylePreview";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle, Clock, DollarSign, Sparkles, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Props {
  pathway: Pathway;
  rank: number;
}

const feasibilityColor = {
  high: { bar: "bg-green-500", text: "text-green-700", bg: "bg-green-100" },
  medium: { bar: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-100" },
  low: { bar: "bg-red-500", text: "text-red-700", bg: "bg-red-100" },
};

function buildUserContext(form: UserFormData | null): UserContext | null {
  if (!form) return null;
  return {
    age: form.age,
    english_level: form.english_level,
    other_languages: form.other_languages,
    occupation: form.occupation,
    work_experience: form.work_experience,
    education: form.education,
    funds_cny: form.funds_cny,
    monthly_income: form.monthly_income,
    nationality: form.nationality,
    why_this_place: form.why_this_place,
  };
}

export function PathwayCard({ pathway, rank }: Props) {
  const t = useTranslations("result");
  const tPrep = useTranslations("result.prepare");
  const tLife = useTranslations("result.lifestyle");
  const [expanded, setExpanded] = useState(rank === 0);
  // openGaps = currently visible; mountedGaps = ever opened (kept in DOM to cache LLM output)
  const [openGaps, setOpenGaps] = useState<Set<number>>(new Set());
  const [mountedGaps, setMountedGaps] = useState<Set<number>>(new Set());
  const [lifestyleOpen, setLifestyleOpen] = useState(false);
  const [lifestyleEverOpened, setLifestyleEverOpened] = useState(false);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const colors = feasibilityColor[pathway.feasibility_level];

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("immigrationForm");
      if (stored) {
        setUserContext(buildUserContext(JSON.parse(stored) as UserFormData));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleGap = (i: number) => {
    setOpenGaps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
        // mark as mounted so it stays in DOM after collapse (cache the LLM output)
        setMountedGaps((m) => {
          if (m.has(i)) return m;
          const nm = new Set(m);
          nm.add(i);
          return nm;
        });
      }
      return next;
    });
  };

  const toggleLifestyle = () => {
    setLifestyleOpen((v) => {
      if (!v) setLifestyleEverOpened(true);
      return !v;
    });
  };

  const pathwayCtx: PathwayContext = {
    name: pathway.name,
    country: pathway.country,
    visa_type: pathway.visa_type,
    timeline_months: pathway.timeline_months,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div
        className="p-5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              {rank + 1}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900 text-lg">{pathway.name}</h3>
                <Badge variant="outline" className="text-xs">{pathway.visa_type}</Badge>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">{pathway.country}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-right">
              <div className={`text-2xl font-bold ${colors.text}`}>
                {pathway.feasibility_score}
              </div>
              <div className="text-xs text-gray-500">{t("pathways.feasibility")}</div>
            </div>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${colors.bar} transition-all`}
              style={{ width: `${pathway.feasibility_score}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {pathway.timeline_months} {t("pathways.months")}
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            ${pathway.estimated_cost_usd?.toLocaleString()}
          </div>
          <div className="flex items-center gap-1">
            {pathway.pr_possible ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            {t("pathways.pr")}
            {pathway.pr_possible && pathway.pr_after_years
              ? ` (${pathway.pr_after_years}${t("pathways.years")})`
              : ""}
          </div>
          <div className="flex items-center gap-1">
            {pathway.citizenship_possible ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-gray-400" />
            )}
            {t("pathways.citizenship")}
            {pathway.citizenship_possible && pathway.citizenship_after_years
              ? ` (${pathway.citizenship_after_years}${t("pathways.years")})`
              : ""}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5 space-y-5">
          <div className="grid md:grid-cols-2 gap-4 pt-4">
            <div>
              <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {t("pathways.met")}
              </h4>
              <ul className="space-y-1">
                {pathway.requirements_met?.map((r, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-orange-700 mb-2 flex items-center gap-1">
                <XCircle className="h-4 w-4" />
                {t("pathways.gaps")}
              </h4>
              <ul className="space-y-2">
                {pathway.gaps?.map((g, i) => {
                  const isOpen = openGaps.has(i);
                  const isMounted = mountedGaps.has(i);
                  return (
                    <li key={i} className="text-sm text-gray-700">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">→</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <span className="flex-1 min-w-0">{g}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!userContext) return;
                                toggleGap(i);
                              }}
                              disabled={!userContext}
                              className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 flex-shrink-0 ${
                                isOpen
                                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                  : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                              title={
                                userContext
                                  ? undefined
                                  : "Form data unavailable, please restart from home"
                              }
                            >
                              <Sparkles className="h-3 w-3" />
                              {isOpen ? tPrep("collapse") : tPrep("cta")}
                            </button>
                          </div>
                          {isMounted && userContext && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className={isOpen ? "" : "hidden"}
                            >
                              <GapPreparation
                                gap={g}
                                pathway={pathwayCtx}
                                userContext={userContext}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {pathway.steps && pathway.steps.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">{t("pathways.steps")}</h4>
              <div className="space-y-3">
                {pathway.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                      {i < pathway.steps.length - 1 && (
                        <div className="w-0.5 h-full bg-blue-100 mt-1" />
                      )}
                    </div>
                    <div className="pb-3 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{step.phase}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {step.duration_months}个月
                        </span>
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {step.actions?.map((a, j) => (
                          <li key={j} className="text-sm text-gray-600">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700 leading-relaxed">{pathway.summary_zh}</p>
          </div>

          {/* Lifestyle preview CTA */}
          <div onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                if (!userContext) return;
                toggleLifestyle();
              }}
              disabled={!userContext}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                lifestyleOpen
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700"
              }`}
              title={
                userContext
                  ? undefined
                  : "Form data unavailable, please restart from home"
              }
            >
              <MapPin className="h-4 w-4" />
              {lifestyleOpen ? tLife("collapse") : tLife("cta")}
            </button>
            {lifestyleEverOpened && userContext && (
              <div className={lifestyleOpen ? "" : "hidden"}>
                <LifestylePreviewView pathway={pathwayCtx} userContext={userContext} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
