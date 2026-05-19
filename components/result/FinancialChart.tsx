"use client";

import { useTranslations } from "next-intl";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { FinancialAnalysis } from "@/lib/claude";

interface Props {
  financial: FinancialAnalysis;
}

const COLORS = {
  frugal: "#3b82f6",
  comfortable: "#10b981",
  wealthy: "#f59e0b",
};

export function FinancialChart({ financial }: Props) {
  const t = useTranslations("result.financial");

  const data = [
    {
      name: t("frugal"),
      months: financial.frugal.months_sustainable,
      monthly_usd: financial.frugal.monthly_cost_usd,
      color: COLORS.frugal,
      description: financial.frugal.lifestyle_description,
    },
    {
      name: t("comfortable"),
      months: financial.comfortable.months_sustainable,
      monthly_usd: financial.comfortable.monthly_cost_usd,
      color: COLORS.comfortable,
      description: financial.comfortable.lifestyle_description,
    },
    {
      name: t("wealthy"),
      months: financial.wealthy.months_sustainable,
      monthly_usd: financial.wealthy.monthly_cost_usd,
      color: COLORS.wealthy,
      description: financial.wealthy.lifestyle_description,
    },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof data[0] }> }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-semibold text-gray-900">{d.name}</p>
          <p className="text-sm text-gray-600">
            {t("sustainable")}: <span className="font-bold text-gray-900">{d.months} 个月</span>
          </p>
          <p className="text-sm text-gray-600">
            月均花费: <span className="font-bold">${d.monthly_usd?.toLocaleString()}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">{d.description}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-gray-900">{t("title")}</h3>
        <p className="text-gray-500 text-sm mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.map((item) => (
          <div
            key={item.name}
            className="rounded-xl p-4 border-2"
            style={{ borderColor: item.color + "40", backgroundColor: item.color + "0d" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{item.name}</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                style={{ backgroundColor: item.color }}
              >
                {item.months} 个月
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${item.monthly_usd?.toLocaleString()}
              <span className="text-sm font-normal text-gray-500">{t("per_month")}</span>
            </p>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis
              tickFormatter={(v) => `${v}月`}
              tick={{ fontSize: 11 }}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="months" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-3">{t("one_time")}</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("visa_fees")}</span>
            <span className="font-medium">${financial.one_time_costs?.visa_fees_usd?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("legal_fees")}</span>
            <span className="font-medium">${financial.one_time_costs?.legal_fees_usd?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{t("relocation")}</span>
            <span className="font-medium">${financial.one_time_costs?.relocation_usd?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm font-bold pt-2 border-t">
            <span>{t("total")}</span>
            <span>${financial.one_time_costs?.total_usd?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
