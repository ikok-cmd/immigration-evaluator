import OpenAI from "openai";
import { PathwayContext, UserContext } from "@/lib/prepare";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.LLM_API_KEY,
      baseURL: process.env.LLM_BASE_URL || "https://api.deepseek.com/v1",
    });
  }
  return _client;
}

export type LifestyleTierKey = "frugal" | "comfortable" | "wealthy";

export interface DailyBudget {
  rent_per_month_usd: number;
  food_per_day_usd: number;
  utilities_per_month_usd: number;
  transport_per_day_usd: number;
  social_per_week_usd: number;
  healthcare_per_month_usd: number;
  misc_per_month_usd: number;
  total_per_month_usd: number;
  notes: string;
}

export interface SampleDay {
  morning: string;
  noon: string;
  evening: string;
  weekend_extra: string;
}

export interface LifestylePreview {
  city_focus: string;
  vibe_one_liner: string;

  daily_costs: {
    frugal: DailyBudget;
    comfortable: DailyBudget;
    wealthy: DailyBudget;
  };
  sample_day: {
    frugal: SampleDay;
    comfortable: SampleDay;
    wealthy: SampleDay;
  };

  culture: {
    social_style: string;
    work_culture: string;
    pace: string;
    food: string;
    attitude_to_chinese: string;
    lgbt_friendliness: string;
    safety_score: number;
  };

  young_scene: {
    making_friends: string;
    nightlife: string;
    dating: string;
    hobbies_outdoors: string;
    online_convenience: string;
  };

  honest_downsides: string[];
  culture_shock_tips: string[];
}

export interface LifestyleRequest {
  pathway: PathwayContext;
  user_context: UserContext;
}

const LIFESTYLE_SYSTEM_PROMPT = `你是一位在多国长期生活过的本地化生活方式分析师。你的任务是用"如果你已经搬到 xx 了，你的日子会怎么过"的第二人称视角，把抽象的搬家决策还原成一帧帧可感知的生活画面。

读者画像：考虑移民的年轻群体（15-30 岁为主），他们不缺政策资讯，缺的是「真的搬过去之后日子长什么样」的具象预期。

## 你的输出要做到
- **第二人称叙述**：用"你"为主语，让读者代入。例如"你周三下午会常去 X 区那家 €3 一杯 espresso 的咖啡馆蹲半天"
- **数字真实**：日开销估算贴近当地工薪/学生真实物价，不是旅游价
- **场景具体**：不要写"生活舒适"这种空话，要写到具体地点、具体价格、具体时间
- **三档分明**：节俭/舒适/宽裕三档过法在住宿位置、餐饮模式、交通方式、社交频率上要明显不同
- **诚实暴露缺点**：别人/中介不会告诉你的负面信息（孤独、隐性歧视、行政效率、税坑、文化冲击场景）
- **关注年轻人真正在意的事**：怎么交到朋友、夜生活、约会文化、户外活动、外卖网购便利度、亚洲超市、网速等

## 个性化（关键）
用户在表单里填了「**选这里的原因/向往**」字段。你必须把这个向往无缝织进生活预览的方方面面，而不是单独列出来。比如：
- 用户说"想看英超主场" → daily_costs 加进观赛预算，sample_day 周末安排去主场或体育酒吧，young_scene.hobbies_outdoors 提到球迷文化和当地球队
- 用户说"想做数字游牧" → daily_costs 算入 coworking 月费，sample_day 描述咖啡馆办公节奏，young_scene 提到数字游牧聚集区
- 用户说"想读音乐学院" → daily_costs 加乐器维护/演出门票，sample_day 含练习/听音乐会，young_scene 提及当地音乐场景
- 用户说"想跟家人团聚" → sample_day 出现陪伴家人的画面，culture 强调家庭文化

如果用户没填这个字段，按通用画像写。

## 输出格式（必须严格 JSON，无任何额外文字、无 markdown 代码块）
{
  "city_focus": "主要参考城市（如果路径是国家级，选最常见的目的地城市）",
  "vibe_one_liner": "一句话定调这个城市/国家的整体感觉（30字以内）",
  "daily_costs": {
    "frugal":      { "rent_per_month_usd": 数字, "food_per_day_usd": 数字, "utilities_per_month_usd": 数字, "transport_per_day_usd": 数字, "social_per_week_usd": 数字, "healthcare_per_month_usd": 数字, "misc_per_month_usd": 数字, "total_per_month_usd": 数字, "notes": "对应什么样的住宿/吃法/出行（一句话）" },
    "comfortable": { 同上 },
    "wealthy":     { 同上 }
  },
  "sample_day": {
    "frugal":      { "morning": "...", "noon": "...", "evening": "...", "weekend_extra": "..." },
    "comfortable": { 同上 },
    "wealthy":     { 同上 }
  },
  "culture": {
    "social_style": "当地社交风格（直接/含蓄/慢热/热情）+ 一两句解释",
    "work_culture": "工作文化（加班/朝九晚五/远程/工会/年假天数等）",
    "pace": "生活节奏描述",
    "food": "餐饮文化（早午晚饮食习惯、酒文化、外食价格区间）",
    "attitude_to_chinese": "当地人对中国人/亚洲人的态度（包含隐性歧视、好奇度、刻板印象）",
    "lgbt_friendliness": "LGBT+ 友好度（法律层面 + 社会接受度）",
    "safety_score": 1-10的整数（治安综合分）
  },
  "young_scene": {
    "making_friends": "怎么交到朋友（具体场景：兴趣班/语言交换/教会/运动俱乐部/华人聚会）",
    "nightlife": "夜生活长什么样（酒吧文化、人均、几点开始几点散场）",
    "dating": "约会文化（用什么 app、约会节奏、性别角色）",
    "hobbies_outdoors": "户外/兴趣活动场景（爬山/冲浪/二次元/电竞/桌游等）",
    "online_convenience": "外卖、网购、网速、亚洲超市等便利度"
  },
  "honest_downsides": ["缺点1（具体）", "缺点2", "缺点3", "..."],
  "culture_shock_tips": ["缓解文化冲击的实用建议1", "建议2", "..."]
}

## 注意
- 价格用美元（USD），整数
- 所有文本字段用中文
- 专有名词（地名、app 名、品牌名）保留原文
- honest_downsides 至少 3 条
- culture_shock_tips 至少 3 条
- 不要画饼，不要美化`;

function buildUserPrompt(req: LifestyleRequest): string {
  return `## 目标路径
- 国家：${req.pathway.country}
- 路径：${req.pathway.name}（${req.pathway.visa_type}）

## 用户画像
- 年龄：${req.user_context.age} 岁
- 国籍：${req.user_context.nationality}
- 学历：${req.user_context.education}
- 职业：${req.user_context.occupation}
- 英语水平：${req.user_context.english_level}
- 可用资金：${req.user_context.funds_cny ? `人民币 ${req.user_context.funds_cny.toLocaleString()} 元` : "未填"}
- 月收入：${req.user_context.monthly_income ? `人民币 ${req.user_context.monthly_income.toLocaleString()} 元` : "未填"}

## 选这里的原因/向往
${req.user_context.why_this_place || "（用户未填写，按通用画像写）"}

请基于以上信息，生成针对该用户搬到 ${req.pathway.country} 的「如果你已经到了 ${req.pathway.country}」生活预览 JSON。城市优先选用户最可能落地的（首都或最大经济中心），数字基于当地工薪/留学生的真实开销。**如果"原因/向往"字段有内容，把它织进 daily_costs、sample_day、young_scene 等所有相关板块**（不要在单独的字段里只重复用户的原话，要拆解成具体场景、价格、时间、地点）。`;
}

export async function generateLifestylePreview(
  req: LifestyleRequest,
  onChunk?: (text: string) => void
): Promise<void> {
  const model = process.env.LLM_MODEL || "deepseek-chat";

  const stream = await getClient().chat.completions.create({
    model,
    max_tokens: 5000,
    stream: true,
    messages: [
      { role: "system", content: LIFESTYLE_SYSTEM_PROMPT },
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
