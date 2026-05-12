interface RulesConfig {
  bannedImports: string[];
  bannedPatterns: string[];
}

export function securityPrompt(rules: RulesConfig): string {
  let prompt = `## 安全扫描规则

请重点检查以下安全风险:

1. **硬编码密钥**: 检测 API Key、Secret、Token、密码等敏感信息被直接写入代码
   - 匹配模式: key=xxx, token=xxx, secret=xxx, password=xxx, api_key=xxx
   - 常见格式: sk-xxx, AKIAxxx, ghpxxxx, xoxb-xxx
2. **注入风险**: SQL 注入、命令注入、XSS 等明显的注入漏洞
   - 例如: 字符串拼接 SQL、eval() 执行用户输入、innerHTML 赋值
3. **不安全的加密**: 使用 MD5、SHA1 等已知不安全的哈希算法
4. **敏感信息泄露**: 将凭据输出到日志或返回给前端
5. **危险函数调用**: eval(), new Function(), exec(), spawn() 等高危函数`;

  if (rules.bannedPatterns.length > 0) {
    prompt += `\n\n**禁止使用的代码模式**: ${rules.bannedPatterns.join(", ")}`;
  }

  return prompt;
}
