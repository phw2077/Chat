import { CalculatorTool } from './calculator';
import { PMReviewTool } from './pm-review';

// 注册所有可用工具
export const toolsList = [
  new CalculatorTool(),
  new PMReviewTool(),
];

export const getToolsDefinitions = (activeSkills = []) => {
  return toolsList
    .filter(t => activeSkills.includes(t.name))
    .map(t => t.getDefinition());
};
export const executeTool = async (name, args, context) => {
  const tool = toolsList.find(t => t.name === name);
  if (tool) {
    try {
      const result = await tool.execute(args, context);
      return result;
    } catch (e) {
      return `工具执行失败: ${e.message}`;
    }
  }
  return "找不到该工具";
};
