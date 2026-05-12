import { DiffEntry } from "./git.js";
import { VibeguardConfig } from "./config.js";
import { callOpenAI } from "../connectors/openai.js";
import { callOllama } from "../connectors/ollama.js";
import { buildAuditPrompt } from "../rules/index.js";

export interface AuditResult {
  file: string;
  line?: number;
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  suggestion?: string;
}

interface RawAuditItem {
  line?: number;
  severity: "high" | "medium" | "low";
  category: string;
  message: string;
  suggestion?: string;
}

export async function analyzeWithAI(
  entry: DiffEntry,
  config: VibeguardConfig
): Promise<AuditResult[]> {
  const prompt = buildAuditPrompt(entry.diff, config);
  const timeout = config.scan.timeout * 1000;

  const raw = await Promise.race([
    callAI(prompt, config),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI scan timeout")), timeout)
    ),
  ]);

  return parseResults(entry.filePath, raw);
}

async function callAI(
  prompt: string,
  config: VibeguardConfig
): Promise<string> {
  if (config.model.provider === "ollama") {
    return callOllama(prompt, config.model.ollama);
  }
  return callOpenAI(prompt, config.model.openai);
}

function parseResults(filePath: string, raw: string): AuditResult[] {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const items: RawAuditItem[] = JSON.parse(jsonMatch[0]);
    return items.map((item) => ({
      file: filePath,
      line: item.line,
      severity: item.severity,
      category: item.category,
      message: item.message,
      suggestion: item.suggestion,
    }));
  } catch {
    return [];
  }
}
