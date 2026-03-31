import { useState, useEffect, useRef } from 'react';
import renderMathInElement from 'katex/dist/contrib/auto-render.min';

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
  const messagesEndRef = useRef(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession ? currentSession.messages : [];

  // 保存数据
  useEffect(() => { localStorage.setItem('ai_chat_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { if (currentSessionId) localStorage.setItem('ai_current_session_id', currentSessionId); }, [currentSessionId]);
  useEffect(() => { localStorage.setItem('ai_chat_api_key', apiKey); }, [apiKey]);
  useEffect(() => { localStorage.setItem('ai_chat_api_url', apiUrl); }, [apiUrl]);

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
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [...messages, userMessage].map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
          stream: true
        })
      });

      if (!response.ok) throw new Error('请求失败');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

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
              const content = data.choices[0]?.delta?.content || '';
              if (content) {
                assistantText += content;
                setMessages(prev => {
                  const updated = [...prev];
                  const msgIdx = updated.findIndex(m => m.id === assistantMessageId);
                  if (msgIdx !== -1) updated[msgIdx] = { ...updated[msgIdx], text: assistantText };
                  return updated;
                });
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        const msgIdx = updated.findIndex(m => m.id === assistantMessageId);
        if (msgIdx !== -1) updated[msgIdx] = { ...updated[msgIdx], text: '抱歉，请求出错，请检查配置。' };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sessions, currentSessionId, setCurrentSessionId, sessions, messages, input, setInput, isLoading,
    apiKey, setApiKey, apiUrl, setApiUrl, sidebarOpen, setSidebarOpen, showSettings, setShowSettings,
    messagesEndRef, handleNewChat, deleteSession, handleSend, setMessages, renderMath
  };
};
