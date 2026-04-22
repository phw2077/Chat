import { BaseTool } from './base';

export class CalculatorTool extends BaseTool {
  constructor() {
    super();
    this.name = "calculator";
    this.description = "执行基础数学计算（加减乘除）";
    this.parameters = {
      type: "object",
      properties: {
        expression: { type: "string", description: "简单的数学表达式, 如: 12 + 5 * 2" }
      },
      required: ["expression"]
    };
  }

  async execute({ expression }) {
    console.log(`[Tool: Calculator] Calculating: ${expression}`);
    try {
      // 这里的简单练习我们使用 eval，实际项目中建议用专门的数学库
      const result = eval(expression);
      return `结果是: ${result}`;
    } catch (e) {
      return `计算出错: ${e.message}`;
    }
  }
}
