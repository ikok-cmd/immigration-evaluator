import countryData from "./country-data.json";

export const SYSTEM_PROMPT = `你是专业移民规划顾问，根据用户条件输出严格的 JSON 分析。

## 背景数据（各国政策概览）
${JSON.stringify(countryData)}

## 输出格式（纯 JSON，不要 markdown 代码块）
{
  "pathways": [   // 1-3 条最相关的路径
    {
      "name": "路径名称",
      "country": "国家",
      "visa_type": "签证类型",
      "feasibility_score": 0-100,
      "feasibility_level": "high|medium|low",
      "requirements_met": ["..."],
      "gaps": ["..."],   // 待补齐的关键条件，2-4 条
      "estimated_cost_usd": 整数,
      "timeline_months": 整数,
      "steps": [   // 2-4 个主阶段
        {"phase":"...","duration_months":数字,"actions":["关键动作1","关键动作2"]}
      ],
      "pr_possible": bool,
      "pr_after_years": 数字,
      "citizenship_possible": bool,
      "citizenship_after_years": 数字,
      "summary_zh": "2-3 句话要点"
    }
  ],
  "financial_analysis": {
    "currency": "EUR等",
    "exchange_rate_note": "1 EUR ≈ 7.8 CNY 之类",
    "user_funds_local": 数字,
    "frugal":      {"monthly_cost":数字,"monthly_cost_usd":数字,"months_sustainable":数字,"lifestyle_description":"一句话"},
    "comfortable": {同上},
    "wealthy":     {同上},
    "one_time_costs": {"visa_fees_usd":数字,"legal_fees_usd":数字,"relocation_usd":数字,"total_usd":数字}
  },
  "timeline": {
    "preparation_months": 数字, "application_months": 数字, "approval_months": 数字, "total_months": 数字,
    "milestones": [{"month":数字,"event":"..."}]   // 3-5 个
  },
  "life_planning": {
    "housing":"一两句", "healthcare":"一两句", "tax_implications":"一两句",
    "integration_tips":"一两句", "chinese_community":"一两句", "children_education":"一两句"
  },
  "overall_verdict": "feasible|partially_feasible|not_feasible",
  "verdict_reason": "1-2 句话",
  "top_recommendation": "最推荐路径的 name",
  "summary_zh": "3-4 句话整体建议"
}

## 规则
- 路径不要凑数，宁少勿多；不要过度乐观
- 财务月数 = (资金 - 一次性费用) / 月开销
- 资金不足时直接判 not_feasible 并说明
- 目标"欧洲"等宽泛区域 → 选 2-3 个最匹配的国家
- 中国籍用户须考虑放弃国籍和税务影响
- 所有 description 字段保持简洁，避免冗长复述`;

export function buildUserPrompt(formData: UserFormData): string {
  const regionExpansion: Record<string, string> = {
    "欧洲": "欧盟国家（重点分析：葡萄牙、西班牙、德国、希腊、马耳他等）",
    "东南亚": "东南亚国家（重点分析：泰国、马来西亚、新加坡等）",
    "北美": "北美洲（重点分析：加拿大、美国）",
    "大洋洲": "大洋洲（重点分析：澳大利亚、新西兰）",
    "亚洲": "亚洲国家（重点分析：日本、新加坡、韩国、泰国、马来西亚）",
    "东亚": "东亚国家（重点分析：日本、韩国）",
  };

  const target = regionExpansion[formData.target] || formData.target;

  return `请分析以下用户的移民可行性：

## 个人基本信息
- 年龄：${formData.age} 岁
- 性别：${formData.gender}
- 婚姻状况：${formData.marital_status}
- 子女：${formData.children > 0 ? `${formData.children}个子女` : "无子女"}
- 国籍：${formData.nationality}

## 教育与职业背景
- 最高学历：${formData.education}
- 专业/职业：${formData.occupation}
- 工作经验：${formData.work_experience} 年
- 是否有工作offer：${formData.has_job_offer ? "有" : "无"}

## 语言能力
- 英语水平：${formData.english_level}
- 其他语言：${formData.other_languages || "无"}

## 财务状况
- 可用资金：${formData.funds_cny ? `人民币 ${formData.funds_cny.toLocaleString()} 元` : ""}${formData.funds_usd ? `美元 ${formData.funds_usd.toLocaleString()}` : ""}
- 月收入：${formData.monthly_income ? `人民币 ${formData.monthly_income.toLocaleString()} 元` : "不稳定/待定"}
- 是否有稳定被动收入：${formData.has_passive_income ? "有" : "无"}

## 移民目标
- 目标地区/国家：${target}
- 移民动机：${formData.motivations.join("、")}
- 选择这里的具体原因/向往：${formData.why_this_place || "（未填写）"}
- 期望时间：${formData.timeline_preference || "越快越好"}
- 是否愿意学习当地语言：${formData.willing_to_learn_language ? "是" : "否"}
- 是否愿意放弃中国国籍：${formData.willing_to_renounce ? "愿意考虑" : "不愿意"}

请基于以上信息，给出全面的移民可行性分析。`;
}

export interface UserFormData {
  age: number;
  gender: string;
  marital_status: string;
  children: number;
  nationality: string;
  education: string;
  occupation: string;
  work_experience: number;
  has_job_offer: boolean;
  english_level: string;
  other_languages: string;
  funds_cny?: number;
  funds_usd?: number;
  monthly_income?: number;
  has_passive_income: boolean;
  target: string;
  motivations: string[];
  why_this_place?: string;
  timeline_preference: string;
  willing_to_learn_language: boolean;
  willing_to_renounce: boolean;
}
