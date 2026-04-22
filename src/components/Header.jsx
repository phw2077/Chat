import React from 'react';
import { MenuIcon, TrashIcon, GearIcon, PluginIcon } from './Icons';

export const Header = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  messages, 
  currentSessionId, 
  setMessages, 
  setCurrentSessionId, 
  showSettings, 
  setShowSettings,
  showSkillManager,
  setShowSkillManager
}) => {
  return (
    <header className="header">
      <div style={{display: 'flex', alignItems: 'center'}}>
        <button className="menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <MenuIcon />
        </button>
        <h1>AI Assistant</h1>
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {messages.length > 0 && (
          <button className="settings-btn" onClick={() => { 
            if(window.confirm('确定要清除当前聊天记录吗？')) { 
              setMessages([]); 
              setCurrentSessionId(Date.now().toString()); 
            } 
          }} title="清除当前聊天记录">
            <TrashIcon />
          </button>
        )}
        <button className="settings-btn" onClick={() => setShowSkillManager(!showSkillManager)} title="技能中心">
          <PluginIcon />
        </button>
      </div>
    </header>
  );
};
