import React, { useEffect } from 'react';
import './App.css';
import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Settings } from './components/Settings';
import { SkillManager } from './components/SkillManager';
import { ChatContainer } from './components/ChatContainer';

function App() {
  const chat = useChat();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { 
      e.preventDefault(); 
      chat.handleSend(); 
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        sessions={chat.sessions}
        currentSessionId={chat.currentSessionId}
        setCurrentSessionId={chat.setCurrentSessionId}
        sidebarOpen={chat.sidebarOpen}
        setSidebarOpen={chat.setSidebarOpen}
        handleNewChat={chat.handleNewChat}
        deleteSession={chat.deleteSession}
      />
      
      <div className="app">
        <Header 
          sidebarOpen={chat.sidebarOpen}
          setSidebarOpen={chat.setSidebarOpen}
          messages={chat.messages}
          currentSessionId={chat.currentSessionId}
          setMessages={chat.setMessages}
          setCurrentSessionId={chat.setCurrentSessionId}
          showSettings={chat.showSettings}
          setShowSettings={chat.setShowSettings}
          showSkillManager={chat.showSkillManager}
          setShowSkillManager={chat.setShowSkillManager}
        />

        {chat.showSkillManager && (
          <SkillManager
            activeSkills={chat.activeSkills}
            setActiveSkills={chat.setActiveSkills}
            setShowSkillManager={chat.setShowSkillManager}
          />
        )}

        {chat.showSettings && (
          <Settings 
            apiKey={chat.apiKey}
            setApiKey={chat.setApiKey}
            apiUrl={chat.apiUrl}
            setApiUrl={chat.setApiUrl}
            setShowSettings={chat.setShowSettings}
          />
        )}

        <ChatContainer 
          messages={chat.messages}
          isLoading={chat.isLoading}
          input={chat.input}
          setInput={chat.setInput}
          handleSend={chat.handleSend}
          handleKeyPress={handleKeyPress}
          messagesEndRef={chat.messagesEndRef}
          renderMath={chat.renderMath}
        />
      </div>
    </div>
  );
}

export default App;
