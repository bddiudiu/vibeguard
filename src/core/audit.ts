import chalk from "chalk";
import { getCachedDiff, DiffEntry } from "./git.js";
import { loadConfig, VibeguardConfig } from "./config.js";
import { analyzeWithAI, AuditResult } from "./analyzer.js";

export interface ScanResult {
  passed: boolean;
  issues: AuditResult[];
  scannedFiles: number;
}

export async function runScan(config: VibeguardConfig): Promise<ScanResult> {
  const entries = getCachedDiff(config.rules.ignorePaths);

  if (entries.length === 0) {
    console.log(chalk.dim("🛡️  VibeGuard: 暂存区无代码变更，跳过扫描。"));
    return { passed: true, issues: [], scannedFiles: 0 };
  }

  console.log(
    chalk.cyan(`🛡️  VibeGuard: 发现 ${entries.length} 个变更文件，开始扫描...\n`)
  );

  const allIssues: AuditResult[] = [];

  for (const entry of entries) {
    const truncated = truncateDiff(entry, config.scan.maxDiffChars);
    const issues = await analyzeWithAI(truncated, config);
    allIssues.push(...issues);
  }

  printReport(allIssues);

  return {
    passed: allIssues.filter((i) => i.severity === "high").length === 0,
    issues: allIssues,
    scannedFiles: entries.length,
  };
}

function truncateDiff(entry: DiffEntry, maxChars: number): DiffEntry {
  if (entry.diff.length <= maxChars) return entry;
  return {
    filePath: entry.filePath,
    diff: entry.diff.slice(0, maxChars) + "\n... (diff truncated)",
  };
}

function printReport(issues: AuditResult[]): void {
  if (issues.length === 0) {
    console.log(chalk.green.bold("✅ VibeGuard: 未检测到风险，可以安全提交。"));
    return;
  }

  console.log(chalk.yellow.bold(`\n⚠️  检测到 ${issues.length} 个问题:\n`));

  for (const issue of issues) {
    const icon =
      issue.severity === "high"
        ? chalk.red.bold("🚨 HIGH")
        : issue.severity === "medium"
          ? chalk.yellow("⚠️  MED ")
          : chalk.blue("ℹ️  LOW ");

    console.log(`${icon}  ${chalk.bold(issue.file)}:${issue.line ?? "?"}`);
    console.log(`    ${issue.message}`);
    if (issue.suggestion) {
      console.log(chalk.dim(`    💡 建议: ${issue.suggestion}`));
    }
    console.log();
  }
}
