"use client";

import { useTranslations } from "next-intl";
import { useForm } from "./FormContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Search } from "lucide-react";

interface Props {
  onSubmit: () => void;
  isLoading: boolean;
}

const MOTIVATIONS = [
  "work",
  "retirement",
  "investment",
  "education",
  "lifestyle",
  "safety",
  "family",
  "tax",
] as const;

export function Step3Goals({ onSubmit, isLoading }: Props) {
  const t = useTranslations("form");
  const { formData, updateForm, prevStep } = useForm();

  const toggleMotivation = (m: string) => {
    const current = formData.motivations || [];
    updateForm({
      motivations: current.includes(m)
        ? current.filter((x) => x !== m)
        : [...current, m],
    });
  };

  const isValid =
    formData.target &&
    formData.target.trim().length > 0 &&
    (formData.motivations?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t("step3.title")}</h2>
        <p className="text-gray-500 mt-1">{t("step3.subtitle")}</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="target">
            {t("fields.target")} <span className="text-red-500">*</span>
          </Label>
          <Input
            id="target"
            placeholder={t("fields.target_placeholder")}
            value={formData.target || ""}
            onChange={(e) => updateForm({ target: e.target.value })}
          />
          <p className="text-sm text-gray-500">{t("fields.target_hint")}</p>
        </div>

        <div className="space-y-3">
          <Label>
            {t("fields.motivations")} <span className="text-red-500">*</span>
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {MOTIVATIONS.map((m) => {
              const selected = formData.motivations?.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMotivation(m)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                    selected
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-blue-300"
                  }`}
                >
                  {t(`fields.motivation_${m}`)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="why_this_place">{t("fields.why_this_place")}</Label>
          <Textarea
            id="why_this_place"
            placeholder={t("fields.why_this_place_placeholder")}
            value={formData.why_this_place || ""}
            onChange={(e) => updateForm({ why_this_place: e.target.value })}
            rows={3}
          />
          <p className="text-sm text-gray-500">{t("fields.why_this_place_hint")}</p>
        </div>

        <div className="space-y-2">
          <Label>{t("fields.timeline_preference")}</Label>
          <NativeSelect
            value={formData.timeline_preference || "3years"}
            onChange={(e) => updateForm({ timeline_preference: e.target.value })}
          >
            <option value="asap">{t("fields.timeline_asap")}</option>
            <option value="3years">{t("fields.timeline_3years")}</option>
            <option value="5years">{t("fields.timeline_5years")}</option>
            <option value="flexible">{t("fields.timeline_flexible")}</option>
          </NativeSelect>
        </div>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300"
              checked={formData.willing_to_learn_language ?? true}
              onChange={(e) => updateForm({ willing_to_learn_language: e.target.checked })}
            />
            <span className="font-medium text-gray-900">
              {t("fields.willing_to_learn_language")}
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-gray-300"
              checked={formData.willing_to_renounce ?? false}
              onChange={(e) => updateForm({ willing_to_renounce: e.target.checked })}
            />
            <span className="font-medium text-gray-900">
              {t("fields.willing_to_renounce")}
            </span>
          </label>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep} size="lg" disabled={isLoading}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          {t("buttons.prev")}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!isValid || isLoading}
          size="lg"
          className="px-8 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("buttons.analyzing")}
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              {t("buttons.submit")}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
