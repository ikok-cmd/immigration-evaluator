"use client";

import { useTranslations } from "next-intl";
import { useForm } from "./FormContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Step2Finance() {
  const t = useTranslations("form");
  const { formData, updateForm, nextStep, prevStep } = useForm();

  const isValid = formData.funds_cny && formData.funds_cny > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t("step2.title")}</h2>
        <p className="text-gray-500 mt-1">{t("step2.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="funds_cny">
            {t("fields.funds_cny")} <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
            <Input
              id="funds_cny"
              type="number"
              min={0}
              placeholder={t("fields.funds_cny_placeholder")}
              className="pl-8"
              value={formData.funds_cny || ""}
              onChange={(e) =>
                updateForm({ funds_cny: parseFloat(e.target.value) || undefined })
              }
            />
          </div>
          <p className="text-sm text-gray-500">{t("fields.funds_cny_hint")}</p>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="monthly_income">{t("fields.monthly_income")}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">¥</span>
            <Input
              id="monthly_income"
              type="number"
              min={0}
              placeholder={t("fields.monthly_income_placeholder")}
              className="pl-8"
              value={formData.monthly_income || ""}
              onChange={(e) =>
                updateForm({ monthly_income: parseFloat(e.target.value) || undefined })
              }
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300"
              checked={formData.has_passive_income || false}
              onChange={(e) => updateForm({ has_passive_income: e.target.checked })}
            />
            <div>
              <span className="font-medium text-gray-900">
                {t("fields.has_passive_income")}
              </span>
              <p className="text-sm text-gray-500">{t("fields.has_passive_income_hint")}</p>
            </div>
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300"
              checked={formData.has_job_offer || false}
              onChange={(e) => updateForm({ has_job_offer: e.target.checked })}
            />
            <div>
              <span className="font-medium text-gray-900">
                {t("fields.has_job_offer")}
              </span>
            </div>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
        <p>💡 资金评估参考：50万人民币 ≈ 7万美元 ≈ 6.5万欧元</p>
        <p className="mt-1">所有数据仅用于评估，不会被存储或分享</p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} size="lg">
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t("buttons.prev")}
        </Button>
        <Button onClick={nextStep} disabled={!isValid} size="lg" className="px-8">
          {t("buttons.next")}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
