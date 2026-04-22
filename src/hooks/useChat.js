import { useState, useEffect, useRef } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render.min';
import { getToolsDefinitions, executeTool, toolsList } from '../tools';

const DEFAULT_API_KEY = 'sk-1016ea9c540446a094868468f93d7047';
const DEFAULT_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
const DEFAULT_MODEL = 'qwen-max';

export const useChat = () => {
  const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('ai_chat_sessions');
    if (saved) return JSON.parse(saved);
    // 迁移老记录逻辑
    const oldHistory = localStorage.getItem('ai_chat_history');
    if (oldHistory) {
      const oldMessages = JSON.parse(oldHistory);
      if (oldMessages.length > 0) {
        return [{ id: Date.now().toString(), title: oldMessages[0].text.substring(0, 15) || '新对话', messages: oldMessages, updatedAt: Date.now() }];
      }
    }
    return [];
  });

  const [currentSessionId, setCurrentSessionId] = useState(() => {
    const saved = localStorage.getItem('ai_current_session_id');
    return saved || Date.now().toString();
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_chat_api_key') || DEFAULT_API_KEY);
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('ai_chat_api_url') || DEFAULT_API_URL);
  const [showSettings, setShowSettings] = useState(false);
  const [showSkillManager, setShowSkillManager] = useState(false);
  const [activeSkills, setActiveSkills] = useState(() => {
    const saved = localStorage.getItem('ai_chat_active_skills');
    if (saved) return JSON.parse(saved);
    return toolsList.map(t => t.name); // 默认全部开启
  });
  const messagesEndRef = useRef(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  // 保存数据
  useEffect(() => { localStorage.setItem('ai_chat_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { if (currentSessionId) localStorage.setItem('ai_current_session_id', currentSessionId); }, [currentSessionId]);
  useEffect(() => { localStorage.setItem('ai_chat_api_key', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('ai_chat_api_url', apiUrl); }, [apiUrl]);
  useEffect(() => { localStorage.setItem('ai_chat_active_skills', JSON.stringify(activeSkills)); }, [activeSkills]);

  // 工具逻辑
  const setMessages = (updater) => {
    setSessions(prevSessions => {
      let updatedSessions = [...prevSessions];
      let currentIdx = updatedSessions.findIndex(s => s.id === currentSessionId);
      let oldMessages = currentIdx !== -1 ? updatedSessions[currentIdx].messages : [];
      let newMessages = typeof updater === 'function' ? updater(oldMessages) : updater;

      if (newMessages.length === 0) return updatedSessions.filter(s => s.id !== currentSessionId);

      if (currentIdx === -1) {
        updatedSessions.unshift({ id: currentSessionId, title: newMessages[0]?.text?.substring(0, 15) || '新对话', messages: newMessages, updatedAt: Date.now() });
      } else {
        const sess = { ...updatedSessions[currentIdx], messages: newMessages, updatedAt: Date.now() };
        if ((sess.title === '新对话' || !sess.title) && newMessages.length > 0) sess.title = newMessages[0].text.substring(0, 15);
        updatedSessions[currentIdx] = sess;
      }
      return updatedSessions;
    });
  };

  const handleNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteSession = (e, id) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个对话吗？')) {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (currentSessionId === id) setCurrentSessionId(Date.now().toString());
    }
  };

  // 渲染公式
  const renderMath = (container) => {
    if (container) {
      renderMathInElement(container, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey || !apiUrl) {
      alert('请先设置 API Key 和 API URL');
      return;
    }

    const userMessage = { id: Date.now(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const assistantMessageId = Date.now() + 1;
    setMessages(prev => [...prev, { id: assistantMessageId, text: '', sender: 'assistant' }]);

    try {
      let currentHistory = [...messages, userMessage];
      let toolCallsFound = true;
      let fullAssistantText = '';

      while (toolCallsFound) {
        toolCallsFound = false;
        const activeToolsDefs = getToolsDefinitions(activeSkills);
        const requestBody = {
          model: DEFAULT_MODEL,
          messages: currentHistory.map(m => ({
            role: m.sender === 'user' ? 'user' : (m.sender === 'tool' ? 'tool' : 'assistant'),
            content: m.text,
            ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
            ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {})
          })),
          stream: true,
          ...(activeToolsDefs.length > 0 ? { tools: activeToolsDefs, tool_choice: "auto" } : {})
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error('请求失败');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let chunkText = '';
        let toolCalls = [];

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
                const delta = data.choices[0]?.delta;

                if (delta?.content) {
                  chunkText += delta.content;
                  fullAssistantText += delta.content;
                  setMessages(prev => {
                    const updated = [...prev];
                    const msgIdx = updated.findIndex(m => m.id === assistantMessageId);
                    if (msgIdx !== -1) updated[msgIdx] = { ...updated[msgIdx], text: fullAssistantText };
                    return updated;
                  });
                }

                if (delta?.tool_calls) {
                  toolCallsFound = true;
                  delta.tool_calls.forEach(tc => {
                    const idx = tc.index || 0;
                    if (!toolCalls[idx]) toolCalls[idx] = { id: tc.id, function: { name: '', arguments: '' } };
                    if (tc.id) toolCalls[idx].id = tc.id;
                    if (tc.function?.name) toolCalls[idx].function.name += tc.function.name;
                    if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                  });
                }
              } catch (e) {}
            }
          }
        }

        if (toolCallsFound) {
          // 记录 AI 的工具调用意图
          const aiMessage = { sender: 'assistant', text: chunkText, tool_calls: toolCalls };
          currentHistory.push(aiMessage);

          for (const tc of toolCalls) {
            // 为了让用户看到过程，先临时更新 UI
            let loadingText = tc.function.name === 'pm_review_panel' 
              ? '\n[系统: 正在召唤评审团专家（CTO, CPO, CFO），请稍候（约需10-20秒）...]\n' 
              : `\n[系统: 正在使用 ${tc.function.name} 计算...]\n`;
            
            fullAssistantText += loadingText;
            setMessages(prev => {
              const updated = [...prev];
              const msgIdx = updated.findIndex(m => m.id === assistantMessageId);
              if (msgIdx !== -1) updated[msgIdx] = { ...updated[msgIdx], text: fullAssistantText };
              return updated;
            });

            const onUpdate = (partialText) => {
              setMessages(prev => {
                const updated = [...prev];
                const msgIdx = updated.findIndex(m => m.id === assistantMessageId);
                if (msgIdx !== -1) updated[msgIdx] = { ...updated[msgIdx], text: fullAssistantText + "\n\n" + partialText };
                return updated;
              });
            };

            const args = JSON.parse(tc.function.arguments || '{}');
            const result = await executeTool(tc.function.name, args, { apiKey, apiUrl, model: DEFAULT_MODEL, onUpdate });
            
            let toolTextForLLM = String(result);
            if (tc.function.name === 'pm_review_panel') {
                fullAssistantText += "\n\n" + String(result) + "\n\n---\n*专家评审完毕，主助手正在总结...*\n";
                toolTextForLLM = "各专家的详细评审意见已直接展示在屏幕上给用户看过了。请你只看以上信息，用 50 个字以内的简短话语给出一个你的最终总结或建议，绝对不要重复专家的长篇大论。";
            }
            
            const toolResult = { sender: 'tool', text: toolTextForLLM, tool_call_id: tc.id };
            currentHistory.push(toolResult);
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        const msgIdx = updated.findIndex(m => m.id === assistantMessageId);
        if (msgIdx !== -1) updated[msgIdx] = { ...updated[msgIdx], text: `抱歉，出现错误: ${err.message}` };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sessions, currentSessionId, setCurrentSessionId, sessions, messages, input, setInput, isLoading,
    apiKey, setApiKey, apiUrl, setApiUrl, sidebarOpen, setSidebarOpen, showSettings, setShowSettings,
    showSkillManager, setShowSkillManager, activeSkills, setActiveSkills,
    messagesEndRef, handleNewChat, deleteSession, handleSend, setMessages, renderMath
  };
};
