interface OllamaConfig {
  model: string;
  baseUrl: string;
}

export async function callOllama(
  prompt: string,
  config: OllamaConfig
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "你是代码审计专家。请严格以 JSON 数组格式返回检测结果，不要包含任何其他文本。如果没有发现问题，返回空数组 []。",
        },
        { role: "user", content: prompt },
      ],
      stream: false,
      options: {
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Ollama API error: ${response.status} ${response.statusText}`
    );
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return data.message?.content ?? "[]";
}
