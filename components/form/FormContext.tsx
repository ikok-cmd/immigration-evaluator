"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { UserFormData } from "@/lib/prompts";

interface FormContextType {
  step: number;
  formData: Partial<UserFormData>;
  updateForm: (data: Partial<UserFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetForm: () => void;
}

const defaultFormData: Partial<UserFormData> = {
  gender: "male",
  marital_status: "single",
  children: 0,
  nationality: "中国",
  education: "bachelor",
  work_experience: 0,
  has_job_offer: false,
  english_level: "intermediate",
  other_languages: "",
  has_passive_income: false,
  motivations: [],
  timeline_preference: "3years",
  willing_to_learn_language: true,
  willing_to_renounce: false,
};

const FormContext = createContext<FormContextType | null>(null);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserFormData>>(defaultFormData);

  const updateForm = useCallback((data: Partial<UserFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 3)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);
  const resetForm = useCallback(() => {
    setStep(1);
    setFormData(defaultFormData);
  }, []);

  return (
    <FormContext.Provider value={{ step, formData, updateForm, nextStep, prevStep, resetForm }}>
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error("useForm must be used within FormProvider");
  return ctx;
}
