import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || "https://api.deepseek.com/v1",
});

export type PrepCategory =
  | "language"
  | "finance"
  | "documents"
  | "credentials"
  | "job"
  | "skill"
  | "health"
  | "other";

export type ResourceType =
  | "app"
  | "course"
  | "book"
  | "tutor"
  | "community"
  | "exam"
  | "service"
  | "other";

export interface PrepResource {
  name: string;
  type: ResourceType;
  cost: "free" | "paid" | "freemium";
  notes?: string;
  url?: string;
}

export interface PrepTask {
  title: string;
  description: string;
  time_per_week_hours?: number;
}

export interface PrepPhase {
  title: string;
  duration_weeks: number;
  goal: string;
  tasks: PrepTask[];
  resources: PrepResource[];
}

export interface PreparationPlan {
  gap: string;
  category: PrepCategory;
  category_zh: string;
  overview: string;
  estimated_duration_months: number;
  estimated_budget_usd: number;
  phases: PrepPhase[];
  milestones: { week: number; description: string }[];
  success_criteria: string;
  risks_tips: string[];
}

export interface PathwayContext {
  name: string;
  country: string;
  visa_type: string;
  timeline_months: number;
}

export interface UserContext {
  age: number;
  english_level: string;
  other_languages?: string;
  occupation: string;
  work_experience: number;
  education: string;
  funds_cny?: number;
  monthly_income?: number;
  nationality: string;
  why_this_place?: string;
}

export interface PrepareRequest {
  gap: string;
  pathway: PathwayContext;
  user_context: UserContext;
}

const PREPARE_SYSTEM_PROMPT = `你是一位资深的移民准备顾问，擅长把抽象的"待补齐条件"拆解成可执行的准备计划。

用户已经做完了移民可行性评估，现在想针对某个具体的 gap（待补齐条件）得到一份**结构化、可执行**的准备方案。

## 你的任务
根据用户提供的 gap 文本、目标移民路径上下文、用户当前画像，输出一份分阶段的准备计划。

## 计划应包含的要素
- **分类判断**：自动识别 gap 类型（language / finance / documents / credentials / job / skill / health / other）
- **阶段拆解**：把整个准备周期切成 2-5 个递进阶段，每阶段有明确目标
- **资源推荐**：每阶段给出真实可用的推荐资源（app、课程、书籍、社区、考试、服务），尽量给已知的、公开的资源名称；如果有公开 URL 可给出
- **里程碑**：用"第 N 周"标记关键检查点
- **现实预算**：估算整个准备过程的美元开销
- **避坑提示**：常见误区、隐性成本、时间窗口陷阱等

## 不同 gap 类型的侧重
- **语言（language）**：明确目标 CEFR 等级，分入门/进阶/冲刺阶段，组合 app（Duolingo、Pimsleur、Babbel 等）+ 系统课程（Coursera、Udemy、当地大学）+ 真人陪练（italki、Preply、HelloTalk）+ 考试准备（IELTS、TOEFL、DELE、TEF、TOPIK 等具体考试）
- **资金（finance）**：合规来源说明、需要提前几个月的"季节性资金"窗口、资产证明文件清单、合规跨境路径
- **文凭/资质（credentials）**：对应国家的认证机构（WES、IQAS、ICAS、NARIC、各国 NOSTRIFIKATION 等），所需材料清单、典型耗时、费用
- **工作 offer（job）**：本地化简历、领英策略、目标国主流招聘平台（LinkedIn、Indeed、Seek、StepStone 等）、签证友好雇主清单
- **技能/职业（skill）**：是否需要执照、行业证书（CFA、PMP、AWS 等）、迁移路径
- **健康（health）**：体检要求、疫苗、慢病管理证明

## 输出要求
必须严格返回纯 JSON，不要任何额外文字，不要 markdown 代码块。

JSON 结构：
{
  "gap": "原 gap 文本回显",
  "category": "language/finance/documents/credentials/job/skill/health/other",
  "category_zh": "中文分类名，如「语言学习」",
  "overview": "一段话总结整体策略（80-150字）",
  "estimated_duration_months": 整数月数,
  "estimated_budget_usd": 整数美元预算,
  "phases": [
    {
      "title": "阶段名（如「入门夯实」）",
      "duration_weeks": 周数,
      "goal": "该阶段达成什么（一句话）",
      "tasks": [
        { "title": "任务名", "description": "具体怎么做（1-2句）", "time_per_week_hours": 数字 }
      ],
      "resources": [
        { "name": "资源名称", "type": "app/course/book/tutor/community/exam/service/other", "cost": "free/paid/freemium", "notes": "推荐理由（一句）", "url": "可选公开链接" }
      ]
    }
  ],
  "milestones": [
    { "week": 周数, "description": "里程碑描述（如「完成 A2 模拟考试」）" }
  ],
  "success_criteria": "怎样算彻底准备好了（一段话）",
  "risks_tips": ["避坑提示1", "避坑提示2", "避坑提示3"]
}

## 注意
- 资源推荐必须真实存在、用户能直接搜到
- 时间和预算估算要现实，不要画饼
- phases 至少 2 个、至多 5 个
- 所有文本字段用中文，专有名词（app 名、考试名、机构名）保留原文`;

function buildUserPrompt(req: PrepareRequest): string {
  return `## 待准备的 gap
${req.gap}

## 目标路径上下文
- 路径：${req.pathway.name}
- 国家：${req.pathway.country}
- 签证类型：${req.pathway.visa_type}
- 整体移民时间线：${req.pathway.timeline_months} 个月

## 用户当前画像
- 年龄：${req.user_context.age} 岁
- 国籍：${req.user_context.nationality}
- 学历：${req.user_context.education}
- 职业：${req.user_context.occupation}（${req.user_context.work_experience} 年经验）
- 英语水平：${req.user_context.english_level}
- 其他语言：${req.user_context.other_languages || "无"}
- 可用资金：${req.user_context.funds_cny ? `人民币 ${req.user_context.funds_cny.toLocaleString()} 元` : "未填"}
- 月收入：${req.user_context.monthly_income ? `人民币 ${req.user_context.monthly_income.toLocaleString()} 元` : "未填"}
- 选这里的原因/向往：${req.user_context.why_this_place || "（未填）"}

请基于以上信息，输出针对这个 gap 的准备计划 JSON。如果"选这里的原因/向往"提到了具体场景（如看球、做数字游牧、读音乐学院），把这些动机自然地融入到任务和资源推荐里（例如学语言时优先推荐相关领域词汇/听力材料）。`;
}

export async function generatePreparationPlan(
  req: PrepareRequest,
  onChunk?: (text: string) => void
): Promise<void> {
  const model = process.env.LLM_MODEL || "deepseek-chat";

  const stream = await client.chat.completions.create({
    model,
    max_tokens: 4000,
    stream: true,
    messages: [
      { role: "system", content: PREPARE_SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(req) },
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      onChunk?.(delta);
    }
  }
}
