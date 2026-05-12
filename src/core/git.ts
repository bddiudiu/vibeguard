import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, chmodSync } from "fs";
import { join } from "path";

export interface DiffEntry {
  filePath: string;
  diff: string;
}

const HOOK_PATH = ".git/hooks/pre-commit";

const HOOK_CONTENT = `#!/bin/sh
# VibeGuard pre-commit hook
echo "🛡️  VibeGuard: scanning staged changes..."
npx vibeguard scan
exit $?
`;

/**
 * 从暂存区提取 diff，过滤非代码文件。
 */
export function getCachedDiff(ignorePaths: string[] = []): DiffEntry[] {
  const names = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);

  if (names.length === 0) return [];

  const binaryExts = [
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg",
    ".woff", ".woff2", ".ttf", ".eot",
    ".zip", ".tar", ".gz", ".rar",
    ".pdf", ".exe", ".bin",
    ".mp3", ".mp4", ".avi",
  ];

  const entries: DiffEntry[] = [];

  for (const name of names) {
    if (binaryExts.some((ext) => name.endsWith(ext))) continue;
    if (ignorePaths.some((p) => matchGlob(name, p))) continue;

    try {
      const diff = execSync(`git diff --cached -- "${name}"`, {
        encoding: "utf-8",
        maxBuffer: 1024 * 1024 * 2,
      });
      if (diff.trim()) {
        entries.push({ filePath: name, diff });
      }
    } catch {
      // 跳过无法读取的文件 (如新增的二进制文件)
    }
  }

  return entries;
}

/**
 * 安装 pre-commit hook
 */
export function installHook(): void {
  const gitDir = execSync("git rev-parse --show-toplevel", {
    encoding: "utf-8",
  }).trim();
  const hookPath = join(gitDir, ".git", "hooks", "pre-commit");

  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, "utf-8");
    if (existing.includes("VibeGuard")) {
      return; // 已安装
    }
    // 备份已有 hook
    writeFileSync(hookPath + ".bak", existing);
  }

  writeFileSync(hookPath, HOOK_CONTENT);
  chmodSync(hookPath, 0o755);
}

/**
 * 卸载 pre-commit hook
 */
export function uninstallHook(): void {
  const gitDir = execSync("git rev-parse --show-toplevel", {
    encoding: "utf-8",
  }).trim();
  const hookPath = join(gitDir, ".git", "hooks", "pre-commit");
  const hookPathBak = hookPath + ".bak";

  if (existsSync(hookPathBak)) {
    const { renameSync } = require("fs");
    renameSync(hookPathBak, hookPath);
  } else if (existsSync(hookPath)) {
    const { unlinkSync } = require("fs");
    unlinkSync(hookPath);
  }
}

function matchGlob(name: string, pattern: string): boolean {
  const regex = new RegExp(
    "^" + pattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*") + "$"
  );
  return regex.test(name);
}
