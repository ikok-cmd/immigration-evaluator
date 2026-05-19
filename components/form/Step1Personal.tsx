"use client";

import { useTranslations } from "next-intl";
import { useForm } from "./FormContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function Step1Personal() {
  const t = useTranslations("form");
  const { formData, updateForm, nextStep } = useForm();

  const isValid =
    formData.age &&
    formData.age > 0 &&
    formData.age < 100 &&
    formData.nationality;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t("step1.title")}</h2>
        <p className="text-gray-500 mt-1">{t("step1.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="age">{t("fields.age")} *</Label>
          <Input
            id="age"
            type="number"
            min={18}
            max={80}
            placeholder={t("fields.age_placeholder")}
            value={formData.age || ""}
            onChange={(e) => updateForm({ age: parseInt(e.target.value) || undefined })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("fields.gender")}</Label>
          <NativeSelect
            value={formData.gender || "male"}
            onChange={(e) => updateForm({ gender: e.target.value })}
          >
            <option value="male">{t("fields.gender_male")}</option>
            <option value="female">{t("fields.gender_female")}</option>
            <option value="other">{t("fields.gender_other")}</option>
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label>{t("fields.marital_status")}</Label>
          <NativeSelect
            value={formData.marital_status || "single"}
            onChange={(e) => updateForm({ marital_status: e.target.value })}
          >
            <option value="single">{t("fields.single")}</option>
            <option value="married">{t("fields.married")}</option>
            <option value="divorced">{t("fields.divorced")}</option>
            <option value="widowed">{t("fields.widowed")}</option>
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label>{t("fields.children")}</Label>
          <NativeSelect
            value={String(formData.children ?? 0)}
            onChange={(e) => updateForm({ children: parseInt(e.target.value) })}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={String(n)}>{n}</option>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="nationality">{t("fields.nationality")} *</Label>
          <Input
            id="nationality"
            placeholder={t("fields.nationality_placeholder")}
            value={formData.nationality || ""}
            onChange={(e) => updateForm({ nationality: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("fields.education")}</Label>
          <NativeSelect
            value={formData.education || "bachelor"}
            onChange={(e) => updateForm({ education: e.target.value })}
          >
            <option value="high_school">{t("fields.high_school")}</option>
            <option value="associate">{t("fields.associate")}</option>
            <option value="bachelor">{t("fields.bachelor")}</option>
            <option value="master">{t("fields.master")}</option>
            <option value="phd">{t("fields.phd")}</option>
          </NativeSelect>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="occupation">{t("fields.occupation")}</Label>
          <Input
            id="occupation"
            placeholder={t("fields.occupation_placeholder")}
            value={formData.occupation || ""}
            onChange={(e) => updateForm({ occupation: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("fields.work_experience")}</Label>
          <NativeSelect
            value={String(formData.work_experience ?? 0)}
            onChange={(e) => updateForm({ work_experience: parseInt(e.target.value) })}
          >
            <option value="0">{"< 1 年"}</option>
            <option value="2">1-3 年</option>
            <option value="5">3-7 年</option>
            <option value="10">7-15 年</option>
            <option value="20">15 年以上</option>
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label>{t("fields.english_level")}</Label>
          <NativeSelect
            value={formData.english_level || "intermediate"}
            onChange={(e) => updateForm({ english_level: e.target.value })}
          >
            <option value="none">{t("fields.english_none")}</option>
            <option value="basic">{t("fields.english_basic")}</option>
            <option value="intermediate">{t("fields.english_intermediate")}</option>
            <option value="advanced">{t("fields.english_advanced")}</option>
            <option value="native">{t("fields.english_native")}</option>
          </NativeSelect>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="other_languages">{t("fields.other_languages")}</Label>
          <Input
            id="other_languages"
            placeholder={t("fields.other_languages_placeholder")}
            value={formData.other_languages || ""}
            onChange={(e) => updateForm({ other_languages: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={nextStep}
          disabled={!isValid}
          size="lg"
          className="px-8"
        >
          {t("buttons.next")}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
