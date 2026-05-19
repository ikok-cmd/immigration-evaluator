"use client";

import { useTranslations } from "next-intl";
import { Timeline as TimelineType } from "@/lib/claude";
import { Calendar, Flag } from "lucide-react";

interface Props {
  timeline: TimelineType;
}

export function TimelineView({ timeline }: Props) {
  const t = useTranslations("result.timeline");

  const phases = [
    { label: t("preparation"), months: timeline.preparation_months, color: "bg-blue-500" },
    { label: t("application"), months: timeline.application_months, color: "bg-purple-500" },
    { label: t("approval"), months: timeline.approval_months, color: "bg-green-500" },
  ];

  const total = timeline.total_months;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900">{t("title")}</h3>
        <div className="flex items-center gap-1 text-gray-600 font-medium">
          <Calendar className="h-4 w-4" />
          {t("total")}：{total} 个月
        </div>
      </div>

      <div className="space-y-3">
        {phases.map((phase) => (
          <div key={phase.label} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-gray-900">{phase.label}</span>
              <span className="text-gray-500">{phase.months} 个月</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div
                className={`h-3 rounded-full ${phase.color} transition-all`}
                style={{ width: `${(phase.months / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {timeline.milestones && timeline.milestones.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Flag className="h-4 w-4 text-blue-600" />
            {t("milestones")}
          </h4>
          <div className="relative">
            <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-gray-200" />
            <div className="space-y-4">
              {timeline.milestones.map((m, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold z-10">
                    {m.month}
                  </div>
                  <div className="pt-0.5">
                    <span className="text-sm text-gray-400 mr-2">第 {m.month} 个月</span>
                    <span className="text-sm font-medium text-gray-900">{m.event}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
