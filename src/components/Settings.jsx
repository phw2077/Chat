import React from 'react';

export const Settings = ({ 
  apiKey, 
  setApiKey, 
  apiUrl, 
  setApiUrl, 
  setShowSettings 
}) => {
  return (
    <div className="settings">
      <h2>API 设置</h2>
      <div className="setting-item">
        <label>API Key</label>
        <input 
          type="password" 
          value={apiKey} 
          onChange={e => setApiKey(e.target.value)} 
          placeholder="sk-..." 
        />
      </div>
      <div className="setting-item">
        <label>API URL</label>
        <input 
          type="text" 
          value={apiUrl} 
          onChange={e => setApiUrl(e.target.value)} 
          placeholder="https://api.openai.com/v1/chat/completions" 
        />
      </div>
      <button className="save-btn" onClick={() => setShowSettings(false)}>完成</button>
    </div>
  );
};
