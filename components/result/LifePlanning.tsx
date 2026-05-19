"use client";

import { useTranslations } from "next-intl";
import { LifePlanning } from "@/lib/claude";
import { Home, Heart, Receipt, Users, GraduationCap, Lightbulb } from "lucide-react";

interface Props {
  lifePlanning: LifePlanning;
}

const sections = [
  { key: "housing", icon: Home, color: "text-blue-600 bg-blue-50" },
  { key: "healthcare", icon: Heart, color: "text-red-600 bg-red-50" },
  { key: "tax_implications", icon: Receipt, color: "text-purple-600 bg-purple-50" },
  { key: "chinese_community", icon: Users, color: "text-green-600 bg-green-50" },
  { key: "children_education", icon: GraduationCap, color: "text-yellow-600 bg-yellow-50" },
  { key: "integration_tips", icon: Lightbulb, color: "text-orange-600 bg-orange-50" },
] as const;

const labelMap: Record<string, string> = {
  housing: "住房",
  healthcare: "医疗",
  tax_implications: "税务",
  chinese_community: "华人社区",
  children_education: "子女教育",
  integration_tips: "融入建议",
};

export function LifePlanningSection({ lifePlanning }: Props) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-900">生活规划</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map(({ key, icon: Icon, color }) => {
          const content = lifePlanning[key as keyof LifePlanning];
          if (!content) return null;
          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg ${color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-semibold text-gray-900">{labelMap[key]}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
