import OpenAI from "openai";

interface OpenAIConfig {
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export async function callOpenAI(
  prompt: string,
  config: OpenAIConfig
): Promise<string> {
  const client = new OpenAI({
    apiKey: config.apiKey || process.env.OPENAI_API_KEY,
    baseURL: config.baseUrl,
  });

  const response = await client.chat.completions.create({
    model: config.model,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content:
          "你是代码审计专家。请严格以 JSON 数组格式返回检测结果，不要包含任何其他文本。如果没有发现问题，返回空数组 []。",
      },
      { role: "user", content: prompt },
    ],
  });

  return response.choices[0]?.message?.content ?? "[]";
}
