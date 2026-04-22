/**
 * 工具基类 (Base Interface)
 */
export class BaseTool {
  constructor() {
    this.name = "";
    this.description = "";
    this.parameters = {
      type: "object",
      properties: {},
      required: []
    };
  }

  /**
   * 工具执行逻辑
   * @param {Object} args - AI 传入的参数
   * @returns {Promise<string>} - 返回结果（通常是字符串，以便发送回 AI）
   */
  async execute(args) {
    throw new Error("Method 'execute()' must be implemented.");
  }

  /**
   * 返回 API 需要的定义格式
   */
  getDefinition() {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters
      }
    };
  }
}
