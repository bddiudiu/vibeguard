import { describe, it, expect } from "vitest";

// 模拟幻觉检测的核心逻辑（纯规则匹配，不依赖 AI）
function detectHardcodedSecrets(diff: string): string[] {
  const patterns = [
    /(?:api[_-]?key|token|secret|password)\s*[:=]\s*["'][^"']{8,}["']/gi,
    /sk-[a-zA-Z0-9]{20,}/g,
    /AKIA[0-9A-Z]{16}/g,
    /ghp_[a-zA-Z0-9]{36}/g,
    /xox[bpsa]-[a-zA-Z0-9-]+/g,
  ];

  const findings: string[] = [];
  for (const pattern of patterns) {
    const matches = diff.match(pattern);
    if (matches) findings.push(...matches);
  }
  return findings;
}

function detectDangerousPatterns(diff: string): string[] {
  const patterns = [
    { regex: /eval\s*\(/g, name: "eval()" },
    { regex: /new\s+Function\s*\(/g, name: "new Function()" },
    { regex: /__import__\s*\(\s*["']os["']\s*\)/g, name: "__import__('os')" },
  ];

  const findings: string[] = [];
  for (const { regex, name } of patterns) {
    if (regex.test(diff)) findings.push(name);
  }
  return findings;
}

describe("VibeGuard 本地规则检测", () => {
  describe("硬编码密钥检测", () => {
    it("检测到 Python 风格的 API Key", () => {
      const diff = '+ api_key = "sk-1234567890abcdef1234567890abcdef"';
      const results = detectHardcodedSecrets(diff);
      expect(results.length).toBeGreaterThan(0);
    });

    it("检测到 AWS Access Key", () => {
      const diff = '+ AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"';
      const results = detectHardcodedSecrets(diff);
      expect(results.length).toBeGreaterThan(0);
    });

    it("检测到 GitHub Token", () => {
      const diff = '+ GITHUB_TOKEN = "ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef12"';
      const results = detectHardcodedSecrets(diff);
      expect(results.length).toBeGreaterThan(0);
    });

    it("检测到 Slack Token", () => {
      const diff = '+ token = "xoxb-1234567890-1234567890123-abcdefghijklmnop"';
      const results = detectHardcodedSecrets(diff);
      expect(results.length).toBeGreaterThan(0);
    });

    it("不误报正常赋值", () => {
      const diff = '+ const name = "hello world"';
      const results = detectHardcodedSecrets(diff);
      expect(results.length).toBe(0);
    });
  });

  describe("危险模式检测", () => {
    it("检测到 eval()", () => {
      const diff = '+ eval(userInput)';
      const results = detectDangerousPatterns(diff);
      expect(results).toContain("eval()");
    });

    it("检测到 new Function()", () => {
      const diff = '+ const fn = new Function("return 1")';
      const results = detectDangerousPatterns(diff);
      expect(results).toContain("new Function()");
    });

    it("检测到 Python __import__", () => {
      const diff = '+ __import__("os").system(cmd)';
      const results = detectDangerousPatterns(diff);
      expect(results).toContain("__import__('os')");
    });

    it("正常代码不触发告警", () => {
      const diff = '+ const x = require("lodash")';
      const results = detectDangerousPatterns(diff);
      expect(results.length).toBe(0);
    });
  });
});
