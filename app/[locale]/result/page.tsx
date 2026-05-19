"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { EvaluationResult } from "@/lib/claude";
import { Verdict } from "@/components/result/Verdict";
import { PathwayCard } from "@/components/result/PathwayCard";
import { FinancialChart } from "@/components/result/FinancialChart";
import { TimelineView } from "@/components/result/Timeline";
import { LifePlanningSection } from "@/components/result/LifePlanning";
import { Globe, RotateCcw, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResultPage() {
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();

  useEffect(() => {
    const stored = sessionStorage.getItem("immigrationResult");
    if (!stored) {
      router.push(`/${locale}`);
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      router.push(`/${locale}`);
    }
  }, [router, locale]);

  const switchLocale = () => {
    window.location.href = locale === "zh" ? "/en/result" : "/zh/result";
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-bold text-gray-900 leading-tight">{t("nav.title")}</div>
              <div className="text-xs text-gray-500">{t("nav.subtitle")}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={switchLocale}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              {t("common.lang_switch")}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/${locale}`)}
              className="gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("result.restart")}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">{t("result.title")}</h1>
          <p className="text-gray-500 mt-1">{t("result.subtitle")}</p>
        </div>

        <Verdict result={result} />

        {result.pathways && result.pathways.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              {t("result.pathways.title")}
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </h2>
            {result.pathways.map((pathway, i) => (
              <PathwayCard key={i} pathway={pathway} rank={i} />
            ))}
          </section>
        )}

        {result.financial_analysis && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <FinancialChart financial={result.financial_analysis} />
          </section>
        )}

        {result.timeline && (
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <TimelineView timeline={result.timeline} />
          </section>
        )}

        {result.life_planning && (
          <section>
            <LifePlanningSection lifePlanning={result.life_planning} />
          </section>
        )}

        <div className="flex justify-center pb-8">
          <Button
            onClick={() => router.push(`/${locale}`)}
            variant="outline"
            size="lg"
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t("result.restart")}
          </Button>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          AI 生成内容仅供参考，实际移民政策以官方最新文件为准，建议咨询专业移民律师
        </p>
      </main>
    </div>
  );
}
