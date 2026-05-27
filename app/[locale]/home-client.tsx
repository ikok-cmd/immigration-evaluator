"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { FormProvider, useForm } from "@/components/form/FormContext";
import { Step1Personal } from "@/components/form/Step1Personal";
import { Step2Finance } from "@/components/form/Step2Finance";
import { Step3Goals } from "@/components/form/Step3Goals";
import { UserFormData } from "@/lib/prompts";
import { EvaluationResult } from "@/lib/claude";
import { streamSSE } from "@/lib/sse-client";
import { Globe, Check, Loader2, Circle, Sparkles } from "lucide-react";

function FormSteps() {
  const { step } = useForm();
  const t = useTranslations("form");

  const steps = [t("step1.title"), t("step2.title"), t("step3.title")];

  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 ${
              i + 1 === step
                ? "opacity-100"
                : i + 1 < step
                ? "opacity-70"
                : "opacity-30"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                i + 1 < step
                  ? "bg-blue-600 text-white"
                  : i + 1 === step
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm font-medium hidden sm:inline ${
                i + 1 === step ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {label}
            </span>
          </div>
          {i < 2 && (
            <div
              className={`h-0.5 w-8 sm:w-12 ${
                i + 1 < step ? "bg-blue-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function MainForm() {
  const { step, formData } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async () => {
    setIsLoading(true);
    setStreamText("");
    setError(null);

    try {
      const result = await streamSSE<EvaluationResult>(
        "/api/evaluate",
        formData as UserFormData,
        { onProgress: (acc) => setStreamText(acc) }
      );
      sessionStorage.setItem("immigrationResult", JSON.stringify(result));
      sessionStorage.setItem("immigrationForm", JSON.stringify(formData));
      router.push(`/${locale}/result`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsLoading(false);
    }
  };

  return (
    <div>
      {step === 1 && <Step1Personal />}
      {step === 2 && <Step2Finance />}
      {step === 3 && (
        <Step3Goals onSubmit={handleSubmit} isLoading={isLoading} />
      )}
      {isLoading && <StreamingProgress text={streamText} />}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

const STAGES = [
  { key: '"pathways"',           label: "🛤️ 在分析可行的移民路径" },
  { key: '"financial_analysis"', label: "💰 在测算三档生活的财务可行性" },
  { key: '"timeline"',           label: "⏱️ 在拼接整体时间线" },
  { key: '"life_planning"',      label: "🏠 在写住房、医疗、税务建议" },
  { key: '"overall_verdict"',    label: "⚖️ 在给综合判断" },
  { key: '"summary_zh"',         label: "✍️ 在收尾摘要" },
];

function StreamingProgress({ text }: { text: string }) {
  const found = STAGES.map((s) => text.includes(s.key));
  // current = first un-finished stage that has appeared
  let currentIdx = -1;
  for (let i = found.length - 1; i >= 0; i--) {
    if (found[i]) {
      currentIdx = i;
      break;
    }
  }
  // a stage is "done" once a later stage has started
  return (
    <div className="mt-6 rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-indigo-50/60 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-4">
        <Sparkles className="h-4 w-4 animate-pulse" />
        AI 正在分析（已生成 {text.length.toLocaleString()} 字）
      </div>
      <ul className="space-y-2.5">
        {STAGES.map((s, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isPending = !found[i];
          return (
            <li key={s.key} className="flex items-center gap-2.5 text-sm">
              {isDone ? (
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-gray-300 flex-shrink-0" />
              )}
              <span
                className={
                  isPending
                    ? "text-gray-400"
                    : isCurrent
                    ? "text-blue-700 font-medium"
                    : "text-gray-700"
                }
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
      {text.length > 80 && (
        <div className="mt-4 pt-3 border-t border-blue-100">
          <div className="text-[11px] uppercase tracking-wide text-gray-400 font-semibold mb-1.5">
            实时输出预览
          </div>
          <div className="text-xs text-gray-600 font-mono leading-relaxed max-h-24 overflow-hidden">
            …{text.slice(-280).replace(/\s+/g, " ")}
          </div>
        </div>
      )}
    </div>
  );
}

export function HomePageClient() {
  const t = useTranslations();
  const locale = useLocale();

  const switchLocale = () => {
    window.location.href = locale === "zh" ? "/en" : "/zh";
  };

  return (
    <FormProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Globe className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-bold text-gray-900 leading-tight">
                  {t("nav.title")}
                </div>
                <div className="text-xs text-gray-500">{t("nav.subtitle")}</div>
              </div>
            </div>
            <button
              onClick={switchLocale}
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
            >
              {t("common.lang_switch")}
            </button>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              润哪儿？
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              三分钟填完，AI 替你算好下一站往哪跑 🧳
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <FormSteps />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
            <MainForm />
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            数据仅用于本次分析，不存储个人信息 · AI
            生成内容仅供参考，不构成法律建议
          </p>
        </main>
      </div>
    </FormProvider>
  );
}
