import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  // --- 在这里填入您的默认设置 ---
  // 注意：如果您的 GitHub 仓库是公开的，请不要在这里填写真实的 Key，否则会被人盗用！
  const DEFAULT_API_KEY = ''; // 例如: 'sk-xxxxxxxxxxxx'
  const DEFAULT_API_URL = ''; // 例如: 'https://api.openai.com/v1/chat/completions'
  // -----------------------------

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 从 localStorage -> 环境变量 -> 硬编码默认值 加载初始值
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('ai_chat_api_key') || import.meta.env.VITE_API_KEY || DEFAULT_API_KEY || '';
  });
  const [apiUrl, setApiUrl] = useState(() => {
    return localStorage.getItem('ai_chat_api_url') || import.meta.env.VITE_API_URL || DEFAULT_API_URL || '';
  });

  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  // 当 apiKey 或 apiUrl 改变时，保存到 localStorage
  useEffect(() => {
    localStorage.setItem('ai_chat_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('ai_chat_api_url', apiUrl);
  }, [apiUrl]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!apiKey || !apiUrl) {
      alert('请先设置API Key和API URL');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error('API请求失败');
      }

      const data = await response.json();
      const assistantMessage = {
        id: Date.now() + 1,
        text: data.choices[0]?.message?.content || '抱歉，我无法理解您的问题',
        sender: 'assistant'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: '抱歉，请求失败，请检查API设置',
        sender: 'assistant'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>AI Assistant</h1>
        <button 
          className="settings-btn" 
          onClick={() => setShowSettings(!showSettings)}
          title="API 设置"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
        </button>
      </header>

      {showSettings && (
        <div className="settings">
          <div className="settings-content">
            <h2>API 设置</h2>
            <div className="setting-item">
              <label>API Key</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>
            <div className="setting-item">
              <label>API URL</label>
              <input 
                type="text" 
                value={apiUrl} 
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api..."
              />
            </div>
            <button 
              className="save-btn" 
              onClick={() => setShowSettings(false)}
            >
              完成
            </button>
          </div>
        </div>
      )}

      <div className="chat-container">
        <div className="messages">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
              <p>有什么我可以帮您的吗？</p>
            </div>
          )}
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message ${message.sender}`}
            >
              <div className="message-content">
                <div className="message-text">{message.text}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="message-content">
                <div className="loading">
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                  <div className="loading-dot"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="问我任何问题..."
            className="input"
            rows={1}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
          />
          <button 
            className="send-btn" 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;