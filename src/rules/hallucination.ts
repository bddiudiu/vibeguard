interface RulesConfig {
  bannedImports: string[];
  bannedPatterns: string[];
}

export function hallucinationPrompt(rules: RulesConfig): string {
  let prompt = `## 幻觉检测规则

请重点检查以下 AI 常见的幻觉特征:

1. **虚假 API 调用**: AI 编造了不存在的函数、方法或参数。例如: requests.get_with_auto_retry()、lodash.deepClone() (注意 lodash 中实际是 cloneDeep)
2. **逻辑矛盾**: 代码中存在前后矛盾的条件判断或变量使用
3. **未实现的占位代码**: TODO、FIXME、placeholder、stub 等占位标记
4. **虚构的库引用**: 引入了不存在的 npm 包或 Python 模块
5. **类型/接口不匹配**: 函数签名与调用方式不一致
6. **API 版本错误**: 使用了已废弃或不存在的 API 版本`;

  if (rules.bannedImports.length > 0) {
    prompt += `\n\n**禁止导入的库**: ${rules.bannedImports.join(", ")}`;
  }

  if (rules.bannedPatterns.length > 0) {
    prompt += `\n\n**禁止使用的代码模式**: ${rules.bannedPatterns.join(", ")}`;
  }

  return prompt;
}
