"use client";

import { useTranslations } from "next-intl";
import { EvaluationResult } from "@/lib/claude";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface Props {
  result: EvaluationResult;
}

const verdictConfig = {
  feasible: {
    icon: CheckCircle2,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconColor: "text-green-600",
    textColor: "text-green-900",
    badgeColor: "bg-green-100 text-green-800",
  },
  partially_feasible: {
    icon: AlertCircle,
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    iconColor: "text-yellow-600",
    textColor: "text-yellow-900",
    badgeColor: "bg-yellow-100 text-yellow-800",
  },
  not_feasible: {
    icon: XCircle,
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    iconColor: "text-red-600",
    textColor: "text-red-900",
    badgeColor: "bg-red-100 text-red-800",
  },
};

export function Verdict({ result }: Props) {
  const t = useTranslations("result");
  const config = verdictConfig[result.overall_verdict];
  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border-2 p-6 ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start gap-4">
        <Icon className={`h-10 w-10 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-2xl font-bold ${config.textColor}`}>
              {t(`verdict.${result.overall_verdict}`)}
            </h2>
            {result.top_recommendation && (
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${config.badgeColor}`}>
                推荐路径：{result.top_recommendation}
              </span>
            )}
          </div>
          <p className={`mt-2 text-base leading-relaxed ${config.textColor}`}>
            {result.verdict_reason}
          </p>
          <p className="mt-3 text-gray-700 leading-relaxed">{result.summary_zh}</p>
        </div>
      </div>
    </div>
  );
}
