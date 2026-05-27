"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PathwayContext, UserContext } from "@/lib/prepare";
import { LifestylePreview as LifestyleData, LifestyleTierKey, DailyBudget, SampleDay } from "@/lib/lifestyle";
import { streamSSE } from "@/lib/sse-client";
import {
  Loader2,
  RefreshCw,
  MapPin,
  Sunrise,
  Sun,
  Moon,
  Sparkles,
  Heart,
  Users,
  Briefcase,
  Clock,
  Utensils,
  Shield,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface Props {
  pathway: PathwayContext;
  userContext: UserContext;
}

const TIER_ACCENT: Record<LifestyleTierKey, { active: string; text: string; bg: string }> = {
  frugal:      { active: "bg-emerald-600 text-white border-emerald-600", text: "text-emerald-700", bg: "bg-emerald-50" },
  comfortable: { active: "bg-blue-600 text-white border-blue-600",       text: "text-blue-700",    bg: "bg-blue-50"    },
  wealthy:     { active: "bg-purple-600 text-white border-purple-600",   text: "text-purple-700",  bg: "bg-purple-50"  },
};

export function LifestylePreviewView({ pathway, userContext }: Props) {
  const t = useTranslations("result.lifestyle");
  const [data, setData] = useState<LifestyleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tier, setTier] = useState<LifestyleTierKey>("comfortable");
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setData(null);
    setError(null);
    setProgress(0);

    streamSSE<LifestyleData>(
      "/api/lifestyle",
      { pathway, user_context: userContext },
      {
        signal: ctrl.signal,
        onProgress: (acc) => setProgress(acc.length),
      }
    )
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [pathway, userContext]);

  useEffect(() => {
    fetchData();
    return () => abortRef.current?.abort();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="mt-4 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-5">
        <div className="flex items-center gap-2 text-indigo-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">{t("loading")}</span>
          {progress > 0 && (
            <span className="text-xs text-indigo-500">({progress} chars)</span>
          )}
        </div>
        <div className="mt-3 grid md:grid-cols-3 gap-2">
          <div className="h-20 bg-indigo-100 rounded animate-pulse" />
          <div className="h-20 bg-indigo-100 rounded animate-pulse" />
          <div className="h-20 bg-indigo-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="text-sm text-red-700 mb-2">
          {t("error")}：{error}
        </div>
        <button
          onClick={fetchData}
          className="text-xs font-medium text-red-700 hover:text-red-900 underline"
        >
          {t("regenerate")}
        </button>
      </div>
    );
  }

  const accent = TIER_ACCENT[tier];
  const budget = data.daily_costs[tier];
  const day = data.sample_day[tier];

  return (
    <div className="mt-4 rounded-2xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50/60 via-white to-purple-50/40 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-indigo-100 bg-white/60">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <MapPin className="h-3 w-3" />
              {t("city_focus")}：<span className="font-medium text-gray-700">{data.city_focus}</span>
            </div>
            <p className="text-base text-gray-800 leading-relaxed font-medium">
              <Sparkles className="inline h-4 w-4 text-indigo-500 mr-1" />
              {data.vibe_one_liner}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex-shrink-0 text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-white"
          >
            <RefreshCw className="h-3 w-3" />
            <span className="hidden sm:inline">{t("regenerate")}</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Tier tabs */}
        <div>
          <div className="flex gap-2 mb-4">
            {(["frugal", "comfortable", "wealthy"] as LifestyleTierKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setTier(k)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                  tier === k
                    ? TIER_ACCENT[k].active
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t(`tier_${k}`)}
              </button>
            ))}
          </div>

          {/* Cost breakdown */}
          <div className={`rounded-xl ${accent.bg} p-4 border border-gray-100`}>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t("daily_costs")}
            </div>
            <BudgetGrid t={t} budget={budget} accent={accent} />
            <div className="mt-3 text-xs text-gray-700 italic leading-relaxed">
              {budget.notes}
            </div>
          </div>
        </div>

        {/* Sample day */}
        <SampleDayCard t={t} day={day} accent={accent} />

        {/* Culture */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Heart className="h-4 w-4 text-pink-500" />
            {t("culture")}
            <span className="ml-auto text-xs font-normal text-gray-500 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {t("safety_score")}：
              <span className="font-bold text-gray-800">{data.culture.safety_score}/10</span>
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <CultureItem icon={<Users className="h-3.5 w-3.5" />} label={t("social_style")} text={data.culture.social_style} />
            <CultureItem icon={<Briefcase className="h-3.5 w-3.5" />} label={t("work_culture")} text={data.culture.work_culture} />
            <CultureItem icon={<Clock className="h-3.5 w-3.5" />} label={t("pace")} text={data.culture.pace} />
            <CultureItem icon={<Utensils className="h-3.5 w-3.5" />} label={t("food_culture")} text={data.culture.food} />
            <CultureItem icon={<span className="text-xs">🇨🇳</span>} label={t("attitude_to_chinese")} text={data.culture.attitude_to_chinese} />
            <CultureItem icon={<span className="text-xs">🏳️‍🌈</span>} label={t("lgbt")} text={data.culture.lgbt_friendliness} />
          </div>
        </div>

        {/* Young scene */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            {t("young_scene")}
          </div>
          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <CultureItem icon={<span>👥</span>} label={t("making_friends")} text={data.young_scene.making_friends} />
            <CultureItem icon={<span>🍻</span>} label={t("nightlife")} text={data.young_scene.nightlife} />
            <CultureItem icon={<span>💘</span>} label={t("dating")} text={data.young_scene.dating} />
            <CultureItem icon={<span>🏞️</span>} label={t("hobbies")} text={data.young_scene.hobbies_outdoors} />
            <CultureItem icon={<span>📱</span>} label={t("online_life")} text={data.young_scene.online_convenience} />
          </div>
        </div>

        {/* Honest downsides + shock tips */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <div className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" />
              {t("honest_downsides")}
            </div>
            <ul className="space-y-1.5">
              {data.honest_downsides.map((d, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5">·</span>
                  <span className="flex-1">{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl border border-blue-200 p-4">
            <div className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-1">
              <Lightbulb className="h-4 w-4" />
              {t("shock_tips")}
            </div>
            <ul className="space-y-1.5">
              {data.culture_shock_tips.map((d, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                  <span className="text-blue-500 mt-0.5">·</span>
                  <span className="flex-1">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetGrid({
  t,
  budget,
  accent,
}: {
  t: (k: string) => string;
  budget: DailyBudget;
  accent: { text: string };
}) {
  const items = [
    { key: "breakdown_rent",       value: `$${budget.rent_per_month_usd.toLocaleString()}`,      suffix: "per_month" as const },
    { key: "breakdown_food",       value: `$${budget.food_per_day_usd.toLocaleString()}`,        suffix: "per_day" as const },
    { key: "breakdown_utilities",  value: `$${budget.utilities_per_month_usd.toLocaleString()}`, suffix: "per_month" as const },
    { key: "breakdown_transport",  value: `$${budget.transport_per_day_usd.toLocaleString()}`,   suffix: "per_day" as const },
    { key: "breakdown_social",     value: `$${budget.social_per_week_usd.toLocaleString()}`,     suffix: "per_week" as const },
    { key: "breakdown_healthcare", value: `$${budget.healthcare_per_month_usd.toLocaleString()}`, suffix: "per_month" as const },
    { key: "breakdown_misc",       value: `$${budget.misc_per_month_usd.toLocaleString()}`,      suffix: "per_month" as const },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((it) => (
        <div key={it.key} className="bg-white rounded-lg p-2.5 border border-gray-100">
          <div className="text-[11px] text-gray-500">{t(it.key)}</div>
          <div className="text-sm font-bold text-gray-900 mt-0.5">
            {it.value}
            <span className="text-[10px] text-gray-400 ml-0.5">{t(it.suffix)}</span>
          </div>
        </div>
      ))}
      <div className={`rounded-lg p-2.5 border-2 ${accent.text} bg-white col-span-2 md:col-span-1`} style={{ borderColor: "currentColor" }}>
        <div className={`text-[11px] ${accent.text} font-semibold`}>{t("breakdown_total")}</div>
        <div className={`text-sm font-extrabold ${accent.text} mt-0.5`}>
          ${budget.total_per_month_usd.toLocaleString()}
          <span className="text-[10px] ml-0.5 opacity-70">{t("per_month")}</span>
        </div>
      </div>
    </div>
  );
}

function SampleDayCard({
  t,
  day,
  accent,
}: {
  t: (k: string) => string;
  day: SampleDay;
  accent: { bg: string };
}) {
  const slots = [
    { key: "morning", icon: <Sunrise className="h-4 w-4 text-amber-500" />, text: day.morning },
    { key: "noon",    icon: <Sun className="h-4 w-4 text-yellow-500" />,    text: day.noon },
    { key: "evening", icon: <Moon className="h-4 w-4 text-indigo-500" />,   text: day.evening },
    { key: "weekend", icon: <span className="text-base">🎒</span>,           text: day.weekend_extra },
  ];
  return (
    <div className={`rounded-xl ${accent.bg} border border-gray-100 p-4`}>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {t("sample_day")}
      </div>
      <div className="space-y-2">
        {slots.map((s) => (
          <div key={s.key} className="flex items-start gap-2.5">
            <div className="flex-shrink-0 w-6 flex justify-center pt-0.5">{s.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-500">{t(s.key)}</div>
              <div className="text-sm text-gray-800 leading-relaxed">{s.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CultureItem({
  icon,
  label,
  text,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex-shrink-0 mt-0.5 w-5 flex justify-center">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-gray-500">{label}</div>
        <div className="text-sm text-gray-800 leading-relaxed">{text}</div>
      </div>
    </div>
  );
}
