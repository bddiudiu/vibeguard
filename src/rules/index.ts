import { VibeguardConfig } from "../core/config.js";
import { hallucinationPrompt } from "./hallucination.js";
import { securityPrompt } from "./security.js";

export function buildAuditPrompt(
  diff: string,
  config: VibeguardConfig
): string {
  const sections: string[] = [];

  sections.push("请分析以下 git diff 变更，检测代码中的幻觉错误和安全风险。\n");

  if (config.scan.hallucinationDetection) {
    sections.push(hallucinationPrompt(config.rules));
  }

  if (config.scan.securityScan) {
    sections.push(securityPrompt(config.rules));
  }

  sections.push(`---\n\n以下是待分析的 diff:\n\n\`\`\`diff\n${diff}\n\`\`\``);

  sections.push(`
请按照以下 JSON 格式返回检测结果（如果没有问题，返回空数组 []）:

[
  {
    "line": 可选的行号,
    "severity": "high" | "medium" | "low",
    "category": "hallucination" | "security" | "banned-import" | "banned-pattern",
    "message": "问题描述",
    "suggestion": "可选的修复建议"
  }
]`);

  return sections.join("\n\n");
}
