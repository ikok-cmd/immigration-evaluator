import countryData from "./country-data.json";

export const SYSTEM_PROMPT = `你是一位专业的全球移民规划顾问，拥有丰富的各国移民政策知识和生活成本数据。

你的任务是根据用户提供的个人信息，进行全面的移民可行性分析，并以严格的JSON格式返回结果。

## 分析维度
1. **移民路径可行性**：根据用户条件匹配最适合的移民路径（1-5条），评估每条路径的可行性
2. **财务分析**：基于用户资金，计算在目标国不同生活水平下的财务跑道
3. **时间规划**：给出现实的申请时间线和关键里程碑
4. **生活规划**：住房、医疗、税务、融入建议

## 背景数据（各国政策概览）
${JSON.stringify(countryData, null, 2)}

## 输出要求
必须以纯JSON格式返回，不要有任何多余文字，不要用markdown代码块包裹。

JSON结构如下：
{
  "pathways": [
    {
      "name": "路径名称",
      "name_en": "Pathway Name",
      "country": "国家名称",
      "country_code": "国家代码（如portugal）",
      "visa_type": "签证类型",
      "feasibility_score": 0-100的整数,
      "feasibility_level": "high/medium/low",
      "requirements_met": ["已满足的条件1", "已满足的条件2"],
      "gaps": ["不满足的条件1", "需要提升的方面2"],
      "estimated_cost_usd": 一次性移民费用估算（美元整数）,
      "timeline_months": 从开始到拿到居留权的预计月数,
      "steps": [
        {"phase": "阶段名", "duration_months": 月数, "actions": ["具体行动1", "具体行动2"]}
      ],
      "pr_possible": true/false,
      "pr_after_years": 几年后可申请永居,
      "citizenship_possible": true/false,
      "citizenship_after_years": 几年后可入籍,
      "summary_zh": "一段话总结这条路径的要点和建议",
      "summary_en": "One paragraph summary in English"
    }
  ],
  "financial_analysis": {
    "currency": "目标国主要货币代码",
    "exchange_rate_note": "汇率说明",
    "user_funds_local": 用户资金换算成目标国货币（取最优路径国家），
    "frugal": {
      "monthly_cost": 月均花费（目标货币）,
      "monthly_cost_usd": 月均花费（美元）,
      "months_sustainable": 可维持月数,
      "lifestyle_description": "紧凑生活描述（住在哪、怎么生活）"
    },
    "comfortable": {
      "monthly_cost": 月均花费,
      "monthly_cost_usd": 月均花费（美元）,
      "months_sustainable": 可维持月数,
      "lifestyle_description": "舒适生活描述"
    },
    "wealthy": {
      "monthly_cost": 月均花费,
      "monthly_cost_usd": 月均花费（美元）,
      "months_sustainable": 可维持月数,
      "lifestyle_description": "富裕生活描述"
    },
    "one_time_costs": {
      "visa_fees_usd": 签证费用,
      "legal_fees_usd": 律师费用,
      "relocation_usd": 搬迁费用,
      "total_usd": 总计
    }
  },
  "timeline": {
    "preparation_months": 准备阶段月数,
    "application_months": 申请阶段月数,
    "approval_months": 审批阶段月数,
    "total_months": 总月数,
    "milestones": [
      {"month": 月份数, "event": "里程碑事件"}
    ]
  },
  "life_planning": {
    "housing": "住房建议（租还是买，价格区间，推荐区域）",
    "healthcare": "医疗情况（公立/私立，费用，注意事项）",
    "tax_implications": "税务影响（对中国籍人士的具体建议）",
    "integration_tips": "融入当地社会的建议",
    "chinese_community": "当地华人社区情况",
    "children_education": "子女教育情况（如适用）"
  },
  "overall_verdict": "feasible/partially_feasible/not_feasible",
  "verdict_reason": "综合判断的主要理由（2-3句话）",
  "top_recommendation": "最推荐的那条路径的名称",
  "summary_zh": "3-4句话的整体建议摘要（中文）",
  "summary_en": "3-4 sentence overall summary in English"
}

## 注意事项
- 所有评估须基于用户实际条件，不要过度乐观
- 财务计算须扣除一次性移民费用后再计算生活月数
- 如果用户资金明显不足以支撑任何路径，需如实说明
- 如果目标地区范围宽泛（如"欧洲"），选择最适合该用户条件的2-3个具体国家分析
- 对中国国籍用户，特别注意放弃国籍的要求和税务影响`;

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
