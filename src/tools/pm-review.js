import { BaseTool } from './base';

export class PMReviewTool extends BaseTool {
  constructor() {
    super();
    this.name = "pm_review_panel";
    this.description = "调用产品经理评审团（CTO、CPO、CFO）对一个新的产品想法或功能进行多维度的专业评估。";
    this.parameters = {
      type: "object",
      properties: {
        idea: { 
          type: "string", 
          description: "用户提出的产品想法或功能描述" 
        }
      },
      required: ["idea"]
    };
  }

  async execute({ idea }, context) {
    console.log(`[Tool: PM Review] Evaluating idea: ${idea}`);
    
    if (!context || !context.apiKey || !context.apiUrl) {
      return "评审失败：缺少大模型 API 上下文，无法召唤专家。";
    }

    const { apiKey, apiUrl, model, onUpdate } = context;

    // 定义三个专家的角色提示词
    const ctoPrompt = "你是一位资深技术大牛(CTO)。请评估这个方案的技术可行性，指出潜在的架构难点、性能瓶颈、可扩展性问题。请用严谨的技术视角（包含MGSD研究视角，强调系统的鲁棒性与动态适应性）进行剖析。";
    const cpoPrompt = "你是一位产品体验官(CPO)。请专注于UI/UX，站在终端用户角度挑刺，强调人机交互(HCI)体验，思考用户旅程中的痛点和可用性。";
    const cfoPrompt = "你是一位商业分析师(CFO)。请精算成本和收益，评估其商业价值、开发成本估算、ROI（投资回报率）以及潜在的商业化落地风险。";

    // 用于保存流式拼装的临时结果
    let reviews = { cto: "", cpo: "", cfo: "" };

    const updateUI = () => {
      if (onUpdate) {
        const partialReport = `### 🧑‍💻 CTO (技术可行性)
${reviews.cto || "思考中..."}

---
### 🎨 CPO (产品交互体验)
${reviews.cpo || "思考中..."}

---
### 💰 CFO (商业价值评估)
${reviews.cfo || "思考中..."}
`;
        onUpdate(partialReport);
      }
    };

    // 辅助函数：调用大模型并流式读取
    const fetchExpertReviewStream = async (rolePrompt, roleKey) => {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${apiKey}` 
          },
          body: JSON.stringify({
            model: model || 'qwen-max',
            messages: [
              { role: "system", content: rolePrompt },
              { role: "user", content: `请对以下产品想法进行评审：\n\n${idea}` }
            ],
            stream: true // 开启流式输出
          })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('data: ')) {
              const dataStr = line.trim().slice(6);
              if (dataStr === '[DONE]') break;
              try {
                const data = JSON.parse(dataStr);
                const deltaContent = data.choices[0]?.delta?.content;
                if (deltaContent) {
                  reviews[roleKey] += deltaContent;
                  updateUI(); // 只要有新字，就刷新 UI
                }
              } catch (e) {}
            }
          }
        }
      } catch (err) {
        reviews[roleKey] = `专家连线失败: ${err.message}`;
        updateUI();
      }
    };

    try {
      // 初始渲染一次骨架
      updateUI();
      
      // 并发请求三个专家 (流式)
      await Promise.all([
        fetchExpertReviewStream(ctoPrompt, 'cto'),
        fetchExpertReviewStream(cpoPrompt, 'cpo'),
        fetchExpertReviewStream(cfoPrompt, 'cfo')
      ]);

      // 最终汇总成一份 Markdown 报告给回调
      const finalReport = `### 🧑‍💻 CTO (技术可行性)
${reviews.cto}

---
### 🎨 CPO (产品交互体验)
${reviews.cpo}

---
### 💰 CFO (商业价值评估)
${reviews.cfo}
`;
      return finalReport;
    } catch (e) {
      return `评审团会议意外中断: ${e.message}`;
    }
  }
}
