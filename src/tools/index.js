import { CalculatorTool } from './calculator';

// 注册所有可用工具
export const toolsList = [
  new CalculatorTool(),
];

export const getToolsDefinitions = (activeSkills = []) => {
  return toolsList
    .filter(t => activeSkills.includes(t.name))
    .map(t => t.getDefinition());
};
export const executeTool = async (name, args) => {
  const tool = toolsList.find(t => t.name === name);
  if (tool) {
    try {
      const result = await tool.execute(args);
      return result;
    } catch (e) {
      return `工具执行失败: ${e.message}`;
    }
  }
  return "找不到该工具";
};
