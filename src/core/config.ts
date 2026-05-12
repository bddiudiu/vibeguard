import { readFileSync, existsSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

export interface VibeguardConfig {
  model: {
    provider: "openai" | "ollama";
    openai: {
      model: string;
      apiKey?: string;
      baseUrl?: string;
    };
    ollama: {
      model: string;
      baseUrl: string;
    };
  };
  scan: {
    maxDiffChars: number;
    hallucinationDetection: boolean;
    securityScan: boolean;
    timeout: number;
  };
  rules: {
    bannedImports: string[];
    bannedPatterns: string[];
    ignorePaths: string[];
  };
}

const DEFAULT_CONFIG: VibeguardConfig = {
  model: {
    provider: "ollama",
    openai: {
      model: "gpt-4o-mini",
      // 默认使用 OpenAI 官方 API，不设置 baseUrl
    },
    ollama: {
      model: "llama3",
      baseUrl: "http://localhost:11434",
    },
  },
  scan: {
    maxDiffChars: 12000,
    hallucinationDetection: true,
    securityScan: true,
    timeout: 30,
  },
  rules: {
    bannedImports: [],
    bannedPatterns: [],
    ignorePaths: ["dist/**", "node_modules/**"],
  },
};

export async function loadConfig(): Promise<VibeguardConfig> {
  const configPath = join(process.cwd(), ".vibeguard.yaml");

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  const raw = readFileSync(configPath, "utf-8");
  const userConfig = yaml.load(raw) as Partial<VibeguardConfig>;

  return {
    model: {
      ...DEFAULT_CONFIG.model,
      ...userConfig?.model,
      openai: { ...DEFAULT_CONFIG.model.openai, ...userConfig?.model?.openai },
      ollama: { ...DEFAULT_CONFIG.model.ollama, ...userConfig?.model?.ollama },
    },
    scan: { ...DEFAULT_CONFIG.scan, ...userConfig?.scan },
    rules: { ...DEFAULT_CONFIG.rules, ...userConfig?.rules },
  };
}
