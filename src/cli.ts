#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { runScan } from "./core/audit.js";
import { installHook, uninstallHook } from "./core/git.js";
import { loadConfig } from "./core/config.js";

const program = new Command();

program
  .name("vibeguard")
  .description("AI 代码生成的语义安检门 — 在 git commit 前拦截幻觉与安全隐患")
  .version("0.1.0");

program
  .command("scan")
  .description("扫描当前暂存区的变更")
  .option("--no-verify", "强制扫描，不阻止 commit")
  .action(async (opts) => {
    const config = await loadConfig();
    const result = await runScan(config);

    if (!result.passed && opts.verify !== false) {
      console.log(
        chalk.red.bold(
          "\n🛡️  VibeGuard 拦截了本次提交，请修复上述问题后重试。"
        )
      );
      process.exit(1);
    }
  });

program
  .command("init")
  .description("在当前项目安装 git pre-commit hook")
  .action(async () => {
    await installHook();
    console.log(chalk.green("✅ pre-commit hook 已安装。"));
    console.log(
      chalk.dim("   提交时 VibeGuard 将自动扫描变更。使用 --no-verify 可跳过。")
    );
  });

program
  .command("uninstall")
  .description("卸载 git pre-commit hook")
  .action(async () => {
    await uninstallHook();
    console.log(chalk.yellow("⚠️  pre-commit hook 已卸载。"));
  });

program
  .command("config")
  .description("显示当前生效的配置")
  .action(async () => {
    const config = await loadConfig();
    console.log(JSON.stringify(config, null, 2));
  });

program.parse();
