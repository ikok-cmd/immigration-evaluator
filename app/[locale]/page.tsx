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
import { Globe } from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const locale = useLocale();

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData as UserFormData),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let sseBuffer = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });

        // process all complete SSE events (delimited by \n\n)
        const parts = sseBuffer.split("\n\n");
        sseBuffer = parts.pop() ?? ""; // keep incomplete trailing fragment

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              throw new Error(`API 错误: ${data.error}`);
            }
            if (data.chunk) {
              // restore escaped newlines
              accumulated += data.chunk.replace(/\\n/g, "\n");
            }
            if (data.done) break outer;
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message.startsWith("API 错误")) {
              throw parseErr;
            }
          }
        }
      }

      if (!accumulated.trim()) {
        throw new Error("未收到分析结果，请重试");
      }

      const cleaned = accumulated.trim().replace(/^```json\s*/,"").replace(/```\s*$/,"");
      const result: EvaluationResult = JSON.parse(cleaned);
      sessionStorage.setItem("immigrationResult", JSON.stringify(result));
      sessionStorage.setItem("immigrationForm", JSON.stringify(formData));
      router.push(`/${locale}/result`);
    } catch (err) {
      setError(String(err));
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
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
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
              移民适合去哪？
            </h1>
            <p className="mt-3 text-lg text-gray-600">
              输入您的基本信息，AI 为您分析最优移民路径
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
